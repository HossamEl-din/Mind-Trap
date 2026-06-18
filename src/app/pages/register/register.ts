import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { HttpClient } from '@angular/common/http';

@Component({
  selector: 'app-register',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  templateUrl: './register.html',
  styleUrls: ['./register.css']
})
export class Register {
  registerData = {
    username: '', 
    email: '',
    password: '',
    confirmPassword: ''
  };

  isSubmitting = false;
  errorMessage = '';

  private http = inject(HttpClient);
  private router = inject(Router);
  private apiUrl = 'http://hossammourad-001-site1.ltempurl.com/api/Auth/register';

  onRegister() {
    if (!this.registerData.username || !this.registerData.email || !this.registerData.password) {
      this.errorMessage = 'Please fill in all required fields.';
      return;
    }

    if (this.registerData.password !== this.registerData.confirmPassword) {
      this.errorMessage = 'Passwords do not match!';
      return;
    }

    this.isSubmitting = true;
    this.errorMessage = '';
    const payload = {
      fullName: this.registerData.username, 
      email: this.registerData.email,
      password: this.registerData.password,
      skillLevel: "Beginner" 
    };

    this.http.post(this.apiUrl, payload).subscribe({
      next: (res: any) => {
        this.isSubmitting = false;
        alert('Account created successfully! Please log in.'); 
        this.router.navigate(['/login']);
      },
      error: (err) => {
        this.isSubmitting = false;
        this.errorMessage = 'Registration failed. Please check your data or try another email.';
        console.error('Register error:', err);
      }
    });
  }
}