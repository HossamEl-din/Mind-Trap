import { Component, OnInit, signal } from '@angular/core';
import { DecimalPipe } from '@angular/common';
import { RouterModule } from '@angular/router'; 

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [DecimalPipe, RouterModule], 
  templateUrl: './home.html',
  styleUrls: ['./home.css'], 
})
export class Home implements OnInit {
  activeLearners = signal(0);
  problemsSolved = signal(0);
  successStories = signal(0);
  satisfactionRate = signal(0);

  ngOnInit() {
    this.animateCount(this.activeLearners, 10000);
    this.animateCount(this.problemsSolved, 50000);
    this.animateCount(this.successStories, 500);
    this.animateCount(this.satisfactionRate, 95);
  }

  animateCount(sig: any, target: number) {
    const steps = 60;
    const increment = target / steps;
    let current = 0;
    const interval = setInterval(() => {
      current += increment;
      if (current >= target) {
        sig.set(target);
        clearInterval(interval);
      } else {
        sig.set(Math.round(current));
      }
    }, 40);
  }
}