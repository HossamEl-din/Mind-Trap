import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class ChallengeService {
  private http = inject(HttpClient);
  
  private baseUrl = 'http://hossammourad-001-site1.ltempurl.com/api/Challenges';
  
  private getHeaders() {
    let token = localStorage.getItem('token');
    return {
      headers: new HttpHeaders({
        'Authorization': `Bearer ${token}`
      })
    };
  }

  getStats(): Observable<any> {
    return this.http.get(`${this.baseUrl}/stats`, this.getHeaders());
  }

  getActiveChallenges(): Observable<any[]> {
    return this.http.get<any[]>(`${this.baseUrl}/active`, this.getHeaders());
  }

  getPendingChallenges(): Observable<any[]> {
    return this.http.get<any[]>(`${this.baseUrl}/pending`, this.getHeaders());
  }

  getCompletedChallenges(): Observable<any[]> {
    return this.http.get<any[]>(`${this.baseUrl}/completed`, this.getHeaders());
  }

  getLeaderboard(top: number = 10): Observable<any[]> {
    return this.http.get<any[]>(`${this.baseUrl}/leaderboard?top=${top}`, this.getHeaders());
  }

  createChallenge(data: any): Observable<any> {
    // ضفنا /create تاني للتجربة
    return this.http.post(`${this.baseUrl}/create`, data, this.getHeaders());
  }

  acceptChallenge(id: number): Observable<any> {
    return this.http.post(`${this.baseUrl}/${id}/accept`, {}, this.getHeaders());
  }
  
  cancelChallenge(id: number): Observable<any> {
    return this.http.delete(`${this.baseUrl}/${id}`, this.getHeaders());
  }
}