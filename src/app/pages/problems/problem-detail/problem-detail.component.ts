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
  private apiUrl = 'https://hossammourad-001-site1.ltempurl.com/api/Problems';

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
  
  currentHintLevel: number = 1;
  maxHintLevel: number = 3;
  
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
    this.currentHintLevel = 1; 

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
    if (this.currentHintLevel > this.maxHintLevel) {
      this.output = ' لقد وصلت للحد الأقصى من التلميحات (3/3).';
      this.cdr.detectChanges();
      return;
    }

    this.output = `Fetching hint (Level ${this.currentHintLevel}/3)...`;
    this.cdr.detectChanges();

    const hintApiUrl = 'http://127.0.0.1:8001/api/v1/hint'; 

    const payload = {
      problem_description: this.problem?.statement || '', 
      user_code: this.userCode || '',                     
      hint_level: this.currentHintLevel                   
    };

    const token = localStorage.getItem('token'); 
    let headers = new HttpHeaders();
    headers = headers.set('Content-Type', 'application/json'); 
    if (token) {
      headers = headers.set('Authorization', `Bearer ${token}`);
    }

    this.http.post<any>(hintApiUrl, payload, { headers }).subscribe({
      next: (response) => {
        this.output = ` Hint (Level ${response.hint_level}/3):\n${response.hint}`;
        this.currentHintLevel++; 
        this.cdr.detectChanges();
      },
      error: (err) => {
        console.error('Error fetching hint:', err);
        this.output = ' Server Error: Could not load the hint. Please make sure the Hint API is running.';
        this.cdr.detectChanges();
      }
    });
  }

 askAI() {
    const currentDescription = `${this.problem?.title || ''}\n${this.problem?.statement || this.problem?.description || ''}`.trim();
    const currentCode = this.userCode || ''; 

    if (!currentDescription) {
      this.output = ' Error: No problem description available for the AI to analyze.';
      this.cdr.detectChanges();
      return;
    }

    this.output = 'AI is analyzing your code and generating a solution... ';
    this.cdr.detectChanges();

    const solutionApiUrl = 'http://127.0.0.1:8001/api/v1/solution';

    const payload = {
      problem_description: currentDescription,
      user_code: currentCode
    };

    const token = localStorage.getItem('token'); 
    let headers = new HttpHeaders();
    headers = headers.set('Content-Type', 'application/json'); 
    if (token) {
      headers = headers.set('Authorization', `Bearer ${token}`);
    }

    this.http.post<any>(solutionApiUrl, payload, { headers }).subscribe({
      next: (response) => {
        try {
          const data = typeof response === 'string' ? JSON.parse(response) : response;

          if (!data) {
            throw new Error("Empty data received");
          }

          let formattedOutput = ` AI Optimal Solution:\n\n`;
          
          if (data.language) {
            formattedOutput += ` Language: ${data.language}\n\n`;
          }

          if (data.llm_code) {
            const cleanCode = String(data.llm_code).replace(/\\n/g, '\n');
            formattedOutput += ` Code:\n${cleanCode}\n\n`;
          }

          if (data.explanation) {
            formattedOutput += ` Explanation:\n${data.explanation}\n`;
          }

          this.output = formattedOutput.trim();
          this.cdr.detectChanges();

        } catch (error) {
          console.error('Error parsing AI solution data:', error, response);
          this.output = ' AI returned an unformatted response. Please try clicking "AI Solution" again.';
          this.cdr.detectChanges();
        }
      },
      error: (err) => {
        console.error('Error fetching AI solution:', err);
        this.output = ' Server Error: Could not fetch the AI solution. Please try again.';
        this.cdr.detectChanges();
      }
    });
  }

explainCode() {
    const currentDescription = `${this.problem?.title || ''}\n${this.problem?.statement || this.problem?.description || ''}`.trim();

    if (!currentDescription) {
      this.output = ' Error: No problem description available to explain.';
      this.cdr.detectChanges();
      return;
    }

    this.output = 'Generating explanation... ';
    this.cdr.detectChanges();

    const explainApiUrl = 'http://127.0.0.1:8001/api/v1/explain';

    const payload = {
      problem_description: currentDescription
    };

    const token = localStorage.getItem('token'); 
    let headers = new HttpHeaders();
    headers = headers.set('Content-Type', 'application/json'); 
    if (token) {
      headers = headers.set('Authorization', `Bearer ${token}`);
    }

    this.http.post<any>(explainApiUrl, payload, { headers }).subscribe({
      next: (response) => {
        try {
          const data = typeof response === 'string' ? JSON.parse(response) : response;

          if (!data) {
            throw new Error("Empty data received");
          }

          const explanationText = data.explanation || data.Explanation || 'No detailed explanation provided by AI.';
          let formattedExplanation = ` Explanation:\n${explanationText}\n\n`;
          
          if (data.algorithm) {
            const algoString = String(data.algorithm); 
            const cleanAlgorithm = algoString.replace(/\\n/g, '\n').replace(/\\"/g, '"');
            formattedExplanation += ` Algorithm:\n${cleanAlgorithm}\n\n`;
          }
          
          if (data.input_output) {
            formattedExplanation += ` I/O Example:\n${data.input_output}\n\n`;
          }

          if (data.time_complexity) {
            formattedExplanation += ` Time Complexity: ${data.time_complexity}\n`;
          }
          if (data.space_complexity) {
            formattedExplanation += ` Space Complexity: ${data.space_complexity}\n`;
          }

          this.output = formattedExplanation.trim();
          this.cdr.detectChanges();

        } catch (error) {
          console.error('Error parsing explanation data:', error, response);
          this.output = ' AI returned an unformatted response. Please try clicking "Explain" again.';
          this.cdr.detectChanges();
        }
      },
      error: (err) => {
        console.error('Error fetching explanation:', err);
        this.output = ' Server Error: Could not generate the explanation. Please try again.';
        this.cdr.detectChanges();
      }
    });
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

    const runUrl = 'https://hossammourad-001-site1.ltempurl.com/api/Submissions/run';

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
              outputMessage += ` Test Case ${index + 1}: Passed\n`;
            } else {
              outputMessage += ` Test Case ${index + 1}: Failed\n`;
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
        this.output = ' Server Error: Could not run the code. Please try again.';
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
      submitUrl = `https://hossammourad-001-site1.ltempurl.com/api/Challenges/${this.challengeId}/submit`;
      payload = {
        sourceCode: this.userCode,
        languageId: this.languageMap[this.activeLanguage] || 54
      };
    } else {
      submitUrl = 'https://hossammourad-001-site1.ltempurl.com/api/Submissions/submit';
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
        const isAccepted = response.verdict === 'Accepted' || response.status === 'Accepted';

        if (isAccepted) {
          this.runResult = 'success';
          
          if (this.challengeId && response.pointsEarned) {
             this.output = ` Battle Won!\nYou earned +${response.pointsEarned} Points.\n\n`;
          } else {
             this.output = ` Solution Accepted!\nSubmission ID: ${response.submissionId || 'N/A'}\n\n`;
          }

          this.mode = 'review';
          if (this.problem) this.problem.status = 'solved';
          localStorage.setItem(`saved_code_${this.problem?.id}`, this.userCode);
          
        } else {
          this.runResult = 'error';
          this.output = ` Verdict: ${response.verdict || response.status || 'Wrong Answer'}\n\n`;
          if (this.problem) this.problem.status = 'attempted';
        }
        
        
        this.output += ' AI is analyzing your code quality... ';
        this.cdr.detectChanges();

       
        this.analyzeCodeSubmission();

      },
      error: (err) => {
        this.isSubmitting = false;
        this.runResult = 'error';
        this.output = ' Server Error: Could not submit the code. Please try again.';
        console.error('Submission error:', err);
        this.cdr.detectChanges();
      }
    });
  }

 
  analyzeCodeSubmission() {
    const currentDescription = `${this.problem?.title || ''}\n${this.problem?.statement || this.problem?.description || ''}`.trim();
    const currentCode = this.userCode || '';

    const analyzeApiUrl = 'http://127.0.0.1:8001/api/v1/analyze';
    const analyzePayload = {
      problem_description: currentDescription || 'No description provided.',
      user_code: currentCode
    };

    const token = localStorage.getItem('token'); 
    let headers = new HttpHeaders();
    headers = headers.set('Content-Type', 'application/json'); 
    if (token) {
      headers = headers.set('Authorization', `Bearer ${token}`);
    }

    this.http.post<any>(analyzeApiUrl, analyzePayload, { headers }).subscribe({
      next: (response) => {
        this.isSubmitting = false; 
        
        try {
          const data = typeof response === 'string' ? JSON.parse(response) : response;

          
          this.output = this.output.replace(' AI is analyzing your code quality... ', '');

        
          let analysisText = `AI Code Analysis:\n`;
          analysisText += ` Score: ${data.rubric_percentage || data.overall_score || 0}%\n`;
          
          if (data.correctness_reason) {
            analysisText += `\n Feedback:\n${data.correctness_reason}\n`;
          }

          if (data.strengths && data.strengths.length > 0) {
            analysisText += `\n Strengths:\n`;
            data.strengths.forEach((s: string) => analysisText += `- ${s}\n`);
          }

          if (data.weaknesses && data.weaknesses.length > 0) {
            analysisText += `\n Weaknesses:\n`;
            data.weaknesses.forEach((w: string) => analysisText += `- ${w}\n`);
          }

          if (data.improvements && data.improvements.length > 0) {
            analysisText += `\n Suggested Improvements:\n`;
            data.improvements.forEach((i: string) => analysisText += `- ${i}\n`);
          }

          this.output += analysisText.trim();
          this.cdr.detectChanges();

        } catch (error) {
          console.error('Error parsing AI analysis data:', error, response);
          this.output = this.output.replace(' AI is analyzing your code quality... ', ' AI Analysis could not be formatted properly.');
          this.cdr.detectChanges();
        }
      },
      error: (err) => {
        this.isSubmitting = false; 
        console.error('Error fetching AI analysis:', err);
        this.output = this.output.replace(' AI is analyzing your code quality... ', ' AI Analyzer is currently unavailable.');
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