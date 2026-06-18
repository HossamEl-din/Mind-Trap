import { Component, OnInit, inject, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router } from '@angular/router';
import { HttpClient, HttpHeaders } from '@angular/common/http';

@Component({
  selector: 'app-learning-path',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './learning-path.html',
  styleUrls: ['./learning-path.css'],
})
export class LearningPath implements OnInit {
  levelsData: any[] = [];
  activeLevelName: string = '';
  isLoading: boolean = true;
  errorMessage: string = '';

  private http = inject(HttpClient);
  private router = inject(Router);
  private cdr = inject(ChangeDetectorRef); 
  
  private apiUrl = 'https://hossammourad-001-site1.ltempurl.com/api/LearningPath';

  ngOnInit() {
    this.fetchLearningPath();
  }

  private getHeaders() {
    const token = localStorage.getItem('token');
    return new HttpHeaders({
      'Authorization': `Bearer ${token}`
    });
  }

  fetchLearningPath() {
    this.isLoading = true;
    this.http.get<any[]>(this.apiUrl, { headers: this.getHeaders() }).subscribe({
      next: (res) => {
        if (res && Array.isArray(res) && res.length > 0) {
          this.levelsData = res;
          this.activeLevelName = this.levelsData[0].levelName; 
        }
        this.isLoading = false;
        this.cdr.detectChanges();
      },
      error: (err) => {
        console.error('API Error:', err);
        this.errorMessage = 'Failed to load data. Please try again.';
        this.isLoading = false;
        this.cdr.detectChanges();
      }
    });
  }

  trackByFn(index: number, item: any) {
    return item.id;
  }

  get activeTopics(): any[] {
    const level = this.levelsData.find(l => l.levelName === this.activeLevelName);
    return level ? level.topics : [];
  }

  get completedCount() {
    return this.activeTopics.filter(t => t.progressPercentage === 100 || t.status === 'Completed').length;
  }

  get totalProblems() {
    return this.activeTopics.reduce((sum, t) => sum + (t.totalProblems || 0), 0);
  }

  get overallProgress() {
    const total = this.activeTopics.length;
    if (!total) return 0;
    const sum = this.activeTopics.reduce((s, t) => s + (t.progressPercentage || 0), 0);
    return Math.round(sum / total);
  }

  navigateToTopic(topicId: number): void {
    if(topicId) {
       this.router.navigate(['/topic', topicId]);
    }
  }
}