import {
  Component,
  Input,
  Output,
  EventEmitter,
  OnChanges,
  SimpleChanges,
  ViewChild,
  ElementRef,
  AfterViewChecked,
  OnDestroy,
  ChangeDetectorRef
} from '@angular/core';
import { CommonModule, DecimalPipe } from '@angular/common';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { Chart, BarController, CategoryScale, LinearScale, BarElement, Tooltip, Legend } from 'chart.js';

import { Session } from '@models/session.model';
import { MaturityModel } from '@models/maturity-model.model';
import { SessionResult } from '@models/session-result.model';
import { Question } from '@models/question.model';
import { SessionResultService } from '@core/session-result.service';

Chart.register(BarController, CategoryScale, LinearScale, BarElement, Tooltip, Legend);

@Component({
  selector: 'app-session-results-popup',
  standalone: true,
  imports: [CommonModule, DecimalPipe],
  templateUrl: './session-result-popup.component.html',
  styleUrls: ['./session-result-popup.component.scss']
})
export class SessionResultsPopupComponent implements OnChanges, AfterViewChecked, OnDestroy {

  @Input() isOpen = false;
  @Input() session: Session | null = null;
  @Input() model: MaturityModel | null = null;

  @Output() closed = new EventEmitter<void>();

  @ViewChild('radarCanvas') radarCanvas!: ElementRef<HTMLCanvasElement>;

  results: SessionResult[] = [];
  isLoadingResult = false;
  hasResultError = false;

  currentIndex = 0;
  private chart: Chart | null = null;
  private chartNeedsRebuild = false;
  private destroy$ = new Subject<void>();

  constructor(
    private sessionResultService: SessionResultService,
    private cdr: ChangeDetectorRef
  ) {}

  // ── Dérivés ────────────────────────────────────────────────────────────────

  get totalQuestions(): number {
    return this.model?.questions?.length ?? 0;
  }

  get currentQuestion(): Question | null {
    if (!this.model?.questions) return null;
    const sorted = [...this.model.questions].sort((a, b) => a.questionOrder - b.questionOrder);
    return sorted[this.currentIndex] ?? null;
  }

  get averageScore(): string {
    if (!this.results.length || !this.currentQuestion) return '-';
    const counts = this.getAnswerCounts(this.currentIndex);
    if (!counts.size) return '-';
    return [...counts.entries()].sort((a, b) => b[1] - a[1])[0][0];
  }

  get scorePercent(): number {
    if (!this.results.length) return 0;
    const counts = this.getAnswerCounts(this.currentIndex);
    if (!counts.size) return 0;
    const max = Math.max(...counts.values());
    return Math.round((max / this.results.length) * 100);
  }

  getAnswerCounts(index: number): Map<string, number> {
    const map = new Map<string, number>();
    for (const r of this.results) {
      const val = r.values[index] ?? '';
      if (val) map.set(val, (map.get(val) ?? 0) + 1);
    }
    return map;
  }

  // ── Lifecycle ──────────────────────────────────────────────────────────────

  ngOnChanges(changes: SimpleChanges): void {
    const justOpened = changes['isOpen'] && this.isOpen;
    const sessionChanged = changes['session'] && this.isOpen;

    if (justOpened || sessionChanged) {
      this.currentIndex = 0;
      this.results = [];
      this.hasResultError = false;
      this.fetchResult();
      this.cdr.detectChanges();
    }

    if (changes['model']) {
      this.chartNeedsRebuild = true;
      this.cdr.detectChanges();
    }
  }

  private fetchResult(): void {
    if (!this.session) return;

    this.isLoadingResult = true;
    this.sessionResultService.getBySession(this.session.id)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (results: SessionResult[]) => {
          this.results = results;
          this.isLoadingResult = false;
          this.chartNeedsRebuild = true;
          this.cdr.detectChanges();
        },
        error: () => {
          this.hasResultError = true;
          this.isLoadingResult = false;
          this.cdr.detectChanges();
        }
      });
  }

  ngAfterViewChecked(): void {
    if (this.chartNeedsRebuild && this.isOpen && this.radarCanvas) {
      this.chartNeedsRebuild = false;
      this.buildChart();
    }
  }

  ngOnDestroy(): void {
    this.destroyChart();
    this.destroy$.next();
    this.destroy$.complete();
  }

  // ── Navigation ─────────────────────────────────────────────────────────────

  prevQuestion(): void {
    if (this.currentIndex > 0) {
      this.currentIndex--;
      this.chartNeedsRebuild = true;
    }
  }

  nextQuestion(): void {
    if (this.currentIndex < this.totalQuestions - 1) {
      this.currentIndex++;
      this.chartNeedsRebuild = true;
    }
  }

  goToQuestion(index: number): void {
    this.currentIndex = index;
    this.chartNeedsRebuild = true;
  }

  close(): void {
    this.closed.emit();
  }

  onOverlayClick(event: MouseEvent): void {
    if ((event.target as HTMLElement).classList.contains('overlay')) {
      this.close();
    }
  }

  // ── Bar chart ──────────────────────────────────────────────────────────────

  private buildChart(): void {
    if (!this.results.length || !this.model?.questions) return;

    this.destroyChart();

    const total = this.results.length;
    const counts = this.getAnswerCounts(this.currentIndex);
    const labels = [...counts.keys()];
    const data = labels.map(l => Math.round(((counts.get(l) ?? 0) / total) * 100));

    const ctx = this.radarCanvas.nativeElement.getContext('2d');
    if (!ctx) return;

    this.chart = new Chart(ctx, {
      type: 'bar',
      data: {
        labels,
        datasets: [
          {
            label: '% de réponses',
            data,
            backgroundColor: labels.map((_, i) => `hsla(${(i * 60) % 360}, 70%, 60%, 0.7)`),
            borderColor: labels.map((_, i) => `hsla(${(i * 60) % 360}, 70%, 60%, 1)`),
            borderWidth: 1,
            borderRadius: 6
          }
        ]
      },
      options: {
        indexAxis: 'y',
        responsive: true,
        maintainAspectRatio: false,
        scales: {
          x: {
            min: 0,
            max: 100,
            ticks: {
              color: '#94a3b8',
              callback: val => `${val}%`
            },
            grid: { color: 'rgba(148,163,184,0.15)' }
          },
          y: {
            ticks: { color: '#cbd5e1' },
            grid: { display: false }
          }
        },
        plugins: {
          legend: { display: false },
          tooltip: {
            callbacks: {
              label: ctx => ` ${ctx.raw}% (${counts.get(String(ctx.label)) ?? 0}/${total})`
            }
          }
        }
      }
    });
  }

  private destroyChart(): void {
    if (this.chart) {
      this.chart.destroy();
      this.chart = null;
    }
  }
}