import { Component, OnInit, inject, ChangeDetectorRef, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { ActivatedRoute } from '@angular/router';

@Component({
  selector: 'app-problem-detail',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './problem-detail.component.html',
  styleUrl: './problem-detail.component.css',
})
export class ProblemDetail implements OnInit {
  private cdr = inject(ChangeDetectorRef);
  private http = inject(HttpClient); 
  private route = inject(ActivatedRoute); 
  private apiUrl = 'http://hossammourad-001-site1.ltempurl.com/api/Problems';

  @Input() problem: any = {}; 
  @Input() mode: 'solve' | 'review' = 'solve';
  @Output() back = new EventEmitter<void>();

  userCode = '';
  activeLanguage = 'Python';
  languages = ['Python', 'C++', 'Java', 'JavaScript'];
  output = '';
  isRunning = false;
  isSubmitting = false;
  runResult: 'success' | 'error' | null = null;
  
  challengeId: string | null = null;

  activeTab: 'statement' | 'examples' | 'constraints' = 'statement';
  languageMap: { [key: string]: number } = {
    'C++': 54,
    'Java': 62,
    'Python': 71, 
    'JavaScript': 63
  };

  ngOnInit() {
    this.route.queryParamMap.subscribe(qParams => {
      this.challengeId = qParams.get('challengeId');
    });
    this.route.paramMap.subscribe(params => {
      const routeId = params.get('id');
      
      if (routeId) {
        this.problem = { id: routeId };
        this.fetchProblemData(routeId);
      } else if (this.problem && this.problem.id) {
        this.fetchProblemData(this.problem.id);
      }
    });
  }

 fetchProblemData(id: any) {
    const savedCode = localStorage.getItem(`saved_code_${id}`);
    if (savedCode) {
      this.userCode = savedCode;
    }

    const token = localStorage.getItem('token'); 
    let headers = new HttpHeaders();
    if (token) {
      headers = headers.set('Authorization', `Bearer ${token}`);
    }

    this.http.get<any>(`${this.apiUrl}/${id}`, { headers }).subscribe({
      next: (fullData) => {
        Object.assign(this.problem, fullData);
        
        this.problem.inputFormat = this.problem.inputFormat || 'A single string s representing the roman numeral.';
        this.problem.outputFormat = this.problem.outputFormat || 'Print the integer value corresponding to the roman numeral.';

        this.activeTab = 'statement'; 
        this.cdr.detectChanges();
      },
      error: (err) => console.error('Error loading problem details:', err)
    });
  }
  getHint() {
    this.output = 'Fetching hint...';
    setTimeout(() => {
      this.output = '💡 Hint: Try using a hash map to optimize the time complexity.';
      this.cdr.detectChanges();
    }, 1000);
  }

  askAI() {
    this.output = 'AI is thinking...';
    setTimeout(() => {
      this.output = '🤖 AI: Check line 5, you might have an off-by-one error in your loop.';
      this.cdr.detectChanges();
    }, 1500);
  }

  runCode() {
    if (!this.userCode || this.userCode.trim() === '') {
      this.output = 'Please write some code before running.';
      this.runResult = 'error';
      return;
    }

    this.isRunning = true;
    this.output = 'Running code on Test Cases...';

    const payload = {
      problemId: this.problem?.id,
      sourceCode: this.userCode,
      languageId: this.languageMap[this.activeLanguage] || 54
    };

    const runUrl = 'http://hossammourad-001-site1.ltempurl.com/api/Submissions/run';

    const token = localStorage.getItem('token'); 
    let headers = new HttpHeaders();
    if (token) {
      headers = headers.set('Authorization', `Bearer ${token}`);
    }

    this.http.post<any>(runUrl, payload, { headers }).subscribe({
      next: (response) => {
        this.isRunning = false;
        
        let outputMessage = '';
        let allPassed = true;

        if (response.results && response.results.length > 0) {
          response.results.forEach((res: any, index: number) => {
            if (res.passed) {
              outputMessage += `✅ Test Case ${index + 1}: Passed\n`;
            } else {
              outputMessage += `❌ Test Case ${index + 1}: Failed\n`;
              outputMessage += `   Expected: ${res.expectedOutput}\n`;
              outputMessage += `   Actual: ${res.actualOutput}\n`;
              allPassed = false;
            }
          });
        } else {
          outputMessage = 'Run completed, but no results returned from server.';
          allPassed = false;
        }

        this.runResult = allPassed ? 'success' : 'error';
        this.output = outputMessage.trim();
        this.cdr.detectChanges();
      },
      error: (err) => {
        this.isRunning = false;
        this.runResult = 'error';
        this.output = '⚠️ Server Error: Could not run the code. Please try again.';
        this.cdr.detectChanges();
      }
    });
  }

  submitSolution() {
    if (!this.userCode || this.userCode.trim() === '') {
      this.output = 'Please write some code before submitting.';
      this.runResult = 'error';
      return;
    }

    this.isSubmitting = true;
    this.output = 'Submitting code...';

    let submitUrl = '';
    let payload: any = {};

    if (this.challengeId) {
      submitUrl = `http://hossammourad-001-site1.ltempurl.com/api/Challenges/${this.challengeId}/submit`;
      payload = {
        sourceCode: this.userCode,
        languageId: this.languageMap[this.activeLanguage] || 54
      };
    } else {
      submitUrl = 'http://hossammourad-001-site1.ltempurl.com/api/Submissions/submit';
      payload = {
        problemId: this.problem?.id,
        sourceCode: this.userCode,
        languageId: this.languageMap[this.activeLanguage] || 54
      };
    }

    const token = localStorage.getItem('token'); 
    let headers = new HttpHeaders();
    if (token) {
      headers = headers.set('Authorization', `Bearer ${token}`);
    }

    this.http.post<any>(submitUrl, payload, { headers }).subscribe({
      next: (response) => {
        this.isSubmitting = false;

        // بنقبل النتيجة سواء الباك إند سماها verdict أو status
        const isAccepted = response.verdict === 'Accepted' || response.status === 'Accepted';

        if (isAccepted) {
          this.runResult = 'success';
          
          // لو كنا في معركة ورجع نقط، بنعرض رسالة الفوز
          if (this.challengeId && response.pointsEarned) {
             this.output = `🏆 Battle Won!\nYou earned +${response.pointsEarned} Points.`;
          } else {
             this.output = `✅ Solution Accepted!\nSubmission ID: ${response.submissionId || 'N/A'}`;
          }

          this.mode = 'review';
          if (this.problem) this.problem.status = 'solved';
          localStorage.setItem(`saved_code_${this.problem?.id}`, this.userCode);
          
        } else {
          this.runResult = 'error';
          this.output = `❌ Verdict: ${response.verdict || response.status || 'Wrong Answer'}\n`;
          if (this.problem) this.problem.status = 'attempted';
        }
        
        this.cdr.detectChanges();
      },
      error: (err) => {
        this.isSubmitting = false;
        this.runResult = 'error';
        this.output = '⚠️ Server Error: Could not submit the code. Please try again.';
        console.error('Submission error:', err);
        this.cdr.detectChanges();
      }
    });
  }

  switchToSolve() {
    this.mode = 'solve';
    this.runResult = null;
    this.output = '';
    this.cdr.detectChanges();
  }
}