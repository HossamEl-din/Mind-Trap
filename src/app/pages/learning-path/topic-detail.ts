import { Component, OnInit, inject, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, RouterModule } from '@angular/router';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { ProblemDetail } from '../problems/problem-detail/problem-detail.component'; 

interface Resource {
  id: number;
  title: string;
  type: string;
  language: string;
  url: string;
}

interface Problem {
  id: number;
  title: string; 
  difficulty: string;
  originalUrl: string; 
  status: string; 
}

interface TopicDetailData {
  id: number;
  name: string;
  level: string;
  resources: Resource[];
  problems: Problem[];
}

@Component({
  selector: 'app-topic-detail',
  standalone: true,
  imports: [CommonModule, RouterModule, ProblemDetail], 
  templateUrl: './topic-detail.html',
  styleUrls: ['./topic-detail.css']
})
export class TopicDetail implements OnInit {
  topicId: string | null = '';
  topicData: TopicDetailData | null = null;
  isLoading = true;
  viewMode: 'list' | 'solve' | 'review' = 'list';
  selectedProblem: any = null;

  private http = inject(HttpClient);
  private route = inject(ActivatedRoute);
  private cdr = inject(ChangeDetectorRef);
  
  private apiUrl = 'https://hossammourad-001-site1.ltempurl.com/api/LearningPath/topic';

  ngOnInit(): void {
    this.topicId = this.route.snapshot.paramMap.get('id') || this.route.snapshot.paramMap.get('key');
    if (this.topicId) {
      this.fetchTopicDetails(this.topicId);
    } else {
      this.isLoading = false;
    }
  }

  private getHeaders() {
    const token = localStorage.getItem('token');
    return new HttpHeaders({
      'Authorization': `Bearer ${token}`
    });
  }

  fetchTopicDetails(id: string) {
    this.isLoading = true;
    this.http.get<TopicDetailData>(`${this.apiUrl}/${id}`, { headers: this.getHeaders() })
      .subscribe({
        next: (res) => {
          this.topicData = res;
          
   if (this.topicData && this.topicData.problems) {
            this.topicData.problems.forEach(p => {
   const savedCode = localStorage.getItem(`saved_code_${p.id}`);
  if (savedCode) {
       p.status = 'Solved';
      }
            });
          }

          this.isLoading = false;
          this.cdr.detectChanges();
        },
        error: (err) => {
          console.error('Error fetching topic details:', err);
          this.isLoading = false;
          this.cdr.detectChanges();
        }
      });
  }
  openSolve(prob: Problem) {
    this.selectedProblem = prob;
    this.viewMode = prob.status?.toLowerCase() === 'solved' ? 'review' : 'solve';
  }

  backToList() {
    this.viewMode = 'list';
    this.selectedProblem = null;
    if (this.topicId) {
      this.fetchTopicDetails(this.topicId);
    }
  }

  getIcon(type: string): string {
    if (type === 'Video') return '▶️';
    if (type === 'Book') return '📚';
    return '📄';
  }

  getIconClass(type: string): string {
    if (type === 'Video') return 'video';
    if (type === 'Book') return 'book';
    return 'article';
  }
}