import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { HttpClient } from '@angular/common/http';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  templateUrl: './login.html',
  styleUrls: ['./login.css']
})
export class Login {
  loginData = {
    email: '',
    password: ''
  };

  isSubmitting = false;
  errorMessage = '';

  private http = inject(HttpClient);
  private router = inject(Router);
  private apiUrl = 'https://hossammourad-001-site1.ltempurl.com/api/Auth/login';

  onLogin() {
    if (!this.loginData.email || !this.loginData.password) {
      this.errorMessage = 'Please enter your email and password.';
      return;
    }

    this.isSubmitting = true;
    this.errorMessage = '';
    this.http.post(this.apiUrl, this.loginData).subscribe({
      next: (res: any) => {
        localStorage.setItem('token', res.token);
        this.isSubmitting = false;
        this.router.navigate(['/learning-path']);
      },
      error: (err) => {
        this.isSubmitting = false; 
        
        if (err.error && err.error.message) {
            this.errorMessage = err.error.message;
        } else {
            this.errorMessage = 'Login failed. Please check your credentials.';
        }
        
        console.error('Login error:', err);
      }
    });
  }
}