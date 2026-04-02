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

import { Session } from '@models/session.model';
import { MaturityModel } from '@models/maturity-model.model';
import { SessionResult } from '@models/session-result.model';
import { Question } from '@models/question.model';
import { SessionResultService } from '@core/session-result.service';

import {
  Chart,
  RadarController,
  RadialLinearScale,
  PointElement,
  LineElement,
  Filler,
  Tooltip,
  Legend
} from 'chart.js';

Chart.register(
  RadarController,
  RadialLinearScale,
  PointElement,
  LineElement,
  Filler,
  Tooltip,
  Legend
);

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

  private chart: Chart | null = null;
  private chartNeedsRebuild = false;
  private destroy$ = new Subject<void>();

  constructor(
    private sessionResultService: SessionResultService,
    private cdr: ChangeDetectorRef
  ) {}

  // ── Dérivés ────────────────────────────────────────────────────────────────

  get totalParticipants(): number {
    return this.results.length;
  }

  // ── Lifecycle ──────────────────────────────────────────────────────────────

  ngOnChanges(changes: SimpleChanges): void {
    const justOpened = changes['isOpen'] && this.isOpen;
    const sessionChanged = changes['session'] && this.isOpen;

    if (justOpened || sessionChanged) {
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
    get averagePerQuestion(): number[] {
    if (!this.results.length || !this.model?.questions) return [];
    const questions = [...this.model.questions].sort((a, b) => a.questionOrder - b.questionOrder);
    return questions.map((_, qi) =>
      Math.round(this.results.reduce((sum, r) => sum + (Number(r.values[qi]) || 0), 0) / this.results.length * 10) / 10
    );
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
      this.cdr.detectChanges();
    }
  }

  ngOnDestroy(): void {
    this.destroyChart();
    this.destroy$.next();
    this.destroy$.complete();
  }

  // ── Actions ────────────────────────────────────────────────────────────────

  close(): void {
    this.closed.emit();
  }

  onOverlayClick(event: MouseEvent): void {
    if ((event.target as HTMLElement).classList.contains('overlay')) {
      this.close();
    }
  }

  // ── Radar chart ────────────────────────────────────────────────────────────

  private buildChart(): void {
    if (!this.results.length || !this.model?.questions) return;

    this.destroyChart();

    const questions = [...this.model.questions]
      .sort((a, b) => a.questionOrder - b.questionOrder);

    // Une branche par question
    const labels = questions.map(q => q.text ?? `Q${q.questionOrder}`);

    // Un dataset par utilisateur
    const datasets = this.results.map((result, i) => {
      const hue = (i * 47) % 360; // couleurs bien espacées
      return {
        label:result.firstName + ' ' + result.lastName,
        data: questions.map((_, qi) => Number(result.values[qi]) ?? 0),
        backgroundColor: `hsla(${hue}, 70%, 60%, 0.15)`,
        borderColor: `hsla(${hue}, 70%, 60%, 1)`,
        borderWidth: 2,
        pointBackgroundColor: `hsla(${hue}, 70%, 60%, 1)`,
        pointBorderColor: '#fff',
        pointHoverBackgroundColor: '#fff',
        pointHoverBorderColor: `hsla(${hue}, 70%, 60%, 1)`,
        pointRadius: 3,
      };
    });
    const averages = [...this.model.questions]
      .sort((a, b) => a.questionOrder - b.questionOrder)
      .map((_, qi) =>
        Math.round(this.results.reduce((sum, r) => sum + (Number(r.values[qi]) || 0), 0) / this.results.length * 10) / 10
      );

    datasets.push({
      label: 'Moyenne',
      data: averages,
      backgroundColor: 'hsla(70, 100%, 60%, 0.15)',
      borderColor: 'hsla(70, 100%, 60%, 1)',
      borderWidth: 2,
      pointBackgroundColor: 'hsla(70, 100%, 60%, 1)',
      pointBorderColor: '#fff',
      pointHoverBackgroundColor: '#fff',
      pointHoverBorderColor: 'hsla(70, 100%, 60%, 1)',
      pointRadius: 4,
    });

    const ctx = this.radarCanvas.nativeElement.getContext('2d');
    if (!ctx) return;

    // Valeur max dynamique basée sur les réponses
    const allValues = this.results.flatMap(r => r.values.map(Number));
    const maxVal = Math.max(...allValues.filter(v => !isNaN(v)));

    this.chart = new Chart(ctx, {
      type: 'radar',
      data: { labels, datasets },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        scales: {
          r: {
            min: 0,
            max: maxVal,
            ticks: {
              color: '#94a3b8',
              backdropColor: 'transparent',
              stepSize: Math.ceil(maxVal / 4),
            },
            grid: { color: 'rgba(148,163,184,0.15)' },
            angleLines: { color: 'rgba(148,163,184,0.2)' },
            pointLabels: {
              color: '#cbd5e1',
              font: { size: 12 }
            }
          }
        },
        plugins: {
          legend: {
            display: true,
            labels: { color: '#cbd5e1', boxWidth: 12 }
          },
          tooltip: {
            callbacks: {
              label: ctx => ` ${ctx.dataset.label}: ${ctx.raw}`
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