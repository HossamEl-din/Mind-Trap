import { Component, OnInit, inject, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms'; 
import { HttpClient } from '@angular/common/http';
import { ProblemDetail } from './problem-detail/problem-detail.component';

export interface Problem {
  id: number;
  title: string;
  difficulty: 'Easy' | 'Medium' | 'Hard';
  platform: string;
  acceptance: string;
  tags: string[];
  status: 'solved' | 'attempted' | null;
  statement: string; 
  examples: { input: string; output: string }[];
  constraints: string[];
  mySolution?: string;
  
}

@Component({
  selector: 'app-problems',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule, ProblemDetail], 
  templateUrl: './problems.component.html',
  styleUrl: './problems.component.css',
})
export class Problems implements OnInit {
  private http = inject(HttpClient);
  private cdr = inject(ChangeDetectorRef);
  
  private apiUrl = 'http://hossammourad-001-site1.ltempurl.com/api/Problems'; 

  activeTab = 'All';
  difficultyFilter = 'All';
  platformFilter = 'All Platforms';
  searchQuery = '';
  selectedProblem: Problem | null = null;
  viewMode: 'list' | 'solve' | 'review' = 'list';
  isLoading = true; 
  errorMessage = ''; 

  tabs = ['All', 'Solved', 'Unsolved', 'Attempted'];
  difficulties = ['All', 'Easy', 'Medium', 'Hard'];
  platforms = ['All Platforms', 'LeetCode', 'Codeforces', 'AtCoder', 'CodeChef'];

  allProblems: Problem[] = []; 

  ngOnInit(): void {
    this.fetchProblems();
  }

  fetchProblems() {
    this.isLoading = true;
    this.http.get<any>(this.apiUrl).subscribe({
      next: (data) => {
        console.log('Data received:', data);
        this.allProblems = data.$values ? data.$values : data; 
        
        if (this.allProblems && Array.isArray(this.allProblems)) {
          this.allProblems.forEach((p: Problem) => {
            if (p && p.id) {
              const savedCode = localStorage.getItem(`saved_code_${p.id}`);
              if (savedCode) {
                p.status = 'solved';
              }
            }
          });
        }

        this.isLoading = false;
        this.cdr.detectChanges(); 
      },
      error: (err) => {
        this.isLoading = false;
        console.error('Full Error:', err);
        this.cdr.detectChanges();
      }
    });
  }

  get stats() {
    return {
      solved: this.allProblems.filter(p => p.status === 'solved').length,
      attempted: this.allProblems.filter(p => p.status === 'attempted').length,
      total: this.allProblems.length,
      acceptance: '48%', 
    };
  }

  get filteredProblems() {
    return this.allProblems.filter(p => {
      const tabMatch =
        this.activeTab === 'All' ||
        (this.activeTab === 'Solved' && p.status === 'solved') ||
        (this.activeTab === 'Unsolved' && !p.status) ||
        (this.activeTab === 'Attempted' && p.status === 'attempted');

      const diffMatch = this.difficultyFilter === 'All' || p.difficulty === this.difficultyFilter;
      const platformMatch = this.platformFilter === 'All Platforms' || p.platform === this.platformFilter;
      const searchMatch = !this.searchQuery || p.title.toLowerCase().includes(this.searchQuery.toLowerCase());

      return tabMatch && diffMatch && platformMatch && searchMatch;
    });
  }

  openSolve(problem: Problem) {
    this.selectedProblem = problem;
    this.viewMode = 'solve';
  }

  openReview(problem: Problem) {
    this.selectedProblem = problem;
    this.viewMode = 'review';
  }

  backToList() {
    this.viewMode = 'list';
    this.selectedProblem = null;
    this.fetchProblems();
  }
}