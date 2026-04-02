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
  OnDestroy
} from '@angular/core';
import { CommonModule, DecimalPipe } from '@angular/common';
import { Chart, RadarController, RadialLinearScale, PointElement, LineElement, Filler, Tooltip, Legend } from 'chart.js';

import { Session } from '@models/session.model';
import { MaturityModel } from '@models/maturity-model.model';
import { SessionResult } from '@models/session-result.model';
import { Question } from '@models/question.model';

Chart.register(RadarController, RadialLinearScale, PointElement, LineElement, Filler, Tooltip, Legend);

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
  @Input() result: SessionResult | null = null;

  @Output() closed = new EventEmitter<void>();

  @ViewChild('radarCanvas') radarCanvas!: ElementRef<HTMLCanvasElement>;

  currentIndex = 0;
  private chart: Chart | null = null;
  private chartNeedsRebuild = false;

  // ── Dérivés ────────────────────────────────────────────────────────────────

  get totalQuestions(): number {
    return this.model?.questions?.length ?? 0;
  }

  get currentQuestion(): Question | null {
    if (!this.model?.questions) return null;
    const sorted = [...this.model.questions].sort((a, b) => a.questionOrder - b.questionOrder);
    return sorted[this.currentIndex] ?? null;
  }

  get averageScore(): number {
    return this.result?.averages?.[this.currentIndex] ?? 0;
  }

  get maxScore(): number {
    const q = this.currentQuestion;
    if (!q?.answers?.length) return 4;
    return Math.max(...q.answers.map(a => (a as any).value ?? 0));
  }

  get scorePercent(): number {
    if (!this.maxScore) return 0;
    return (this.averageScore / this.maxScore) * 100;
  }

  // ── Lifecycle ──────────────────────────────────────────────────────────────

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['isOpen'] || changes['result'] || changes['model']) {
      this.currentIndex = 0;
      this.chartNeedsRebuild = true;
    }
  }

  ngAfterViewChecked(): void {
    if (this.chartNeedsRebuild && this.isOpen && this.radarCanvas) {
      this.chartNeedsRebuild = false;
      this.buildChart();
    }
  }

  ngOnDestroy(): void {
    this.destroyChart();
  }

  // ── Navigation ─────────────────────────────────────────────────────────────

  prevQuestion(): void {
    if (this.currentIndex > 0) this.currentIndex--;
  }

  nextQuestion(): void {
    if (this.currentIndex < this.totalQuestions - 1) this.currentIndex++;
  }

  goToQuestion(index: number): void {
    this.currentIndex = index;
  }

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
    if (!this.result || !this.model?.questions) return;

    this.destroyChart();

    const sorted = [...this.model.questions].sort((a, b) => a.questionOrder - b.questionOrder);
    const labels = sorted.map((q, i) => `Q${i + 1}`);
    const data = this.result.averages;

    const ctx = this.radarCanvas.nativeElement.getContext('2d');
    if (!ctx) return;

    this.chart = new Chart(ctx, {
      type: 'radar',
      data: {
        labels,
        datasets: [
          {
            label: 'Moyenne',
            data,
            backgroundColor: 'rgba(99, 179, 237, 0.2)',
            borderColor: 'rgba(99, 179, 237, 0.9)',
            borderWidth: 2,
            pointBackgroundColor: 'rgba(99, 179, 237, 1)',
            pointRadius: 4
          }
        ]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        scales: {
          r: {
            min: 0,
            ticks: {
              stepSize: 1,
              color: '#94a3b8',
              backdropColor: 'transparent'
            },
            grid: { color: 'rgba(148,163,184,0.2)' },
            angleLines: { color: 'rgba(148,163,184,0.2)' },
            pointLabels: {
              color: '#cbd5e1',
              font: { size: 12 }
            }
          }
        },
        plugins: {
          legend: { display: false },
          tooltip: {
            callbacks: {
              label: ctx => ` Moyenne : ${ctx.raw}`
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