import { Component, OnInit, inject, ChangeDetectorRef, HostListener } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import * as signalR from '@microsoft/signalr';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './dashboard.html',
  styleUrls: ['./dashboard.css']
})
export class Dashboard implements OnInit {
  
  private http = inject(HttpClient);
  private cdr = inject(ChangeDetectorRef);
  
 
  private apiDomain = 'https://hossammourad-001-site1.ltempurl.com';
  private baseUrl = `${this.apiDomain}/api/Dashboard`;

  stats: any = null;
  learningPath: any[] = [];
  upcomingContests: any[] = [];
  heatmapData: any[] = [];
  isLoading = true;
  notifications: any[] = [];
  unreadCount: number = 0;
  showNotifications: boolean = false;
  private hubConnection: signalR.HubConnection | undefined;

 quickActions = [
    { title: 'Practice Problems', icon: 'fas fa-laptop-code', link: '/problems' },
    { title: 'Challenge Friend', icon: 'fas fa-khanda', link: '/challenges' },
    { title: 'Find Mentor', icon: 'fas fa-chalkboard-teacher', link: '/mentorship' }
  ];
  ngOnInit(): void {
    this.loadDashboardData();
    this.loadNotifications();
    this.startSignalRConnection();
  }

  private getHeaders() {
    const token = localStorage.getItem('token');
    return new HttpHeaders({ 'Authorization': `Bearer ${token}` });
  }

  loadDashboardData() {
    this.isLoading = true;
    const headers = this.getHeaders();

    this.http.get<any>(`${this.baseUrl}/stats`, { headers }).subscribe({
      next: (res) => {
        this.stats = res;
        this.cdr.detectChanges();
      },
      error: (err) => console.error('Error loading stats:', err)
    });

    this.http.get<any[]>(`${this.baseUrl}/learning-path`, { headers }).subscribe({
      next: (res) => {
        const colors = ['#00D9FF', '#3b82f6', '#8b5cf6', '#10b981'];
        const icons = ['⚡', '🔍', '📐', '🧠'];
        
        this.learningPath = (res || []).map((item, index) => ({
            ...item,
            color: colors[index % colors.length],
            icon: icons[index % icons.length]
        }));
        this.cdr.detectChanges();
      },
      error: (err) => console.error('Error loading learning path:', err)
    });

    this.http.get<any[]>(`${this.baseUrl}/contests`, { headers }).subscribe({
      next: (res) => {
        this.upcomingContests = res || [];
        this.cdr.detectChanges();
      },
      error: (err) => console.error('Error loading contests:', err)
    });

    this.http.get<any[]>(`${this.baseUrl}/streak-heatmap`, { headers }).subscribe({
      next: (res) => {
        this.heatmapData = res || [];
        this.isLoading = false;
        this.cdr.detectChanges();
      },
      error: (err) => {
        console.error('Error loading heatmap:', err);
        this.isLoading = false;
        this.cdr.detectChanges();
      }
    });
  }

  loadNotifications() {
    this.http.get<any[]>(`${this.apiDomain}/api/notifications`, { headers: this.getHeaders() }).subscribe({
      next: (res) => {
        this.notifications = res || [];
        this.updateUnreadCount();
        this.cdr.detectChanges();
      },
      error: (err) => console.error('Error loading notifications:', err)
    });
  }

  updateUnreadCount() {
    this.unreadCount = this.notifications.filter(n => !n.isRead).length;
  }

  toggleNotifications(event: Event) {
    event.stopPropagation();
    this.showNotifications = !this.showNotifications;
  }

@HostListener('document:click')
onDocumentClick() {
  this.showNotifications = false;
}
  markAsRead(notification: any, event: Event) {
    event.stopPropagation(); 
    if (notification.isRead) return;

    this.http.put(`${this.apiDomain}/api/notifications/${notification.id}/read`, {}, { headers: this.getHeaders() }).subscribe({
      next: () => {
        notification.isRead = true;
        this.updateUnreadCount();
        this.cdr.detectChanges();
      },
      error: (err) => console.error('Error marking notification as read:', err)
    });
  }

  startSignalRConnection() {
    const token = localStorage.getItem('token');
    if (!token) return;

    this.hubConnection = new signalR.HubConnectionBuilder()
      .withUrl(`${this.apiDomain}/BattleHub`, {
        accessTokenFactory: () => token
      })
      .withAutomaticReconnect()
      .build();

    this.hubConnection.start()
      .then(() => console.log('SignalR Connected to BattleHub'))
      .catch(err => console.error('Error while starting SignalR connection: ' + err));

    this.hubConnection.on('ReceiveNotification', (newNotification: any) => {
      newNotification.isRead = false; 
      newNotification.createdAt = new Date().toISOString(); 
      this.notifications.unshift(newNotification);
      
      if(this.notifications.length > 20) this.notifications.pop(); 
      
      this.updateUnreadCount();
      this.cdr.detectChanges();
    });
  }

  getPlatformColor(platform: string) {
    if (platform === 'Codeforces') return { color: '#ef4444', bg: 'rgba(239, 68, 68, 0.1)' };
    if (platform === 'LeetCode') return { color: '#f59e0b', bg: 'rgba(245, 158, 11, 0.1)' };
    return { color: '#22c55e', bg: 'rgba(34, 197, 94, 0.1)' };
  }

  getPlatformCode(platform: string) {
    if (platform === 'Codeforces') return 'CF';
    if (platform === 'LeetCode') return 'LC';
    if (platform === 'AtCoder') return 'AC';
    return platform ? platform.substring(0, 2).toUpperCase() : '??';
  }
}