import { Component, OnInit } from '@angular/core';
import { RouterOutlet, RouterLink, Router, NavigationEnd } from '@angular/router';
import { NgIf } from '@angular/common';
import { filter } from 'rxjs/operators';


@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet, RouterLink, NgIf],
  templateUrl: './app.html',
  styleUrls: ['./app.scss']
})
export class App implements OnInit {
  showHeader = true;

  constructor(private router: Router) {}

  ngOnInit(): void {
    this.showHeader = this.router.url === '/';

    this.router.events.pipe(
      filter(e => e instanceof NavigationEnd)
    ).subscribe((e: any) => {
      const hiddenRoutes = ['dashboard', 'model', 'team', 'member'];
      this.showHeader = !hiddenRoutes.some(r => e.url.includes(r));
    });
  }
}
