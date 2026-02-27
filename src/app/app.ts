import { Component, signal, OnInit } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import {HttpClient} from '@angular/common/http';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet],
  templateUrl: './app.html',
  styleUrl: './app.css'
})
export class App implements OnInit {
  protected readonly title = signal('front');
  message = signal('Chargement...');

  constructor(private http: HttpClient) {}

  ngOnInit() {
    this.http.get('http://localhost:8080/hello', { responseType: 'text' })
      .subscribe(data => this.message.set (data));
  }
}
