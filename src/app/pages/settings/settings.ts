import { Component, OnInit, inject, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms'; 
import { RouterModule } from '@angular/router';
import { HttpClient, HttpHeaders } from '@angular/common/http';

@Component({
  selector: 'app-settings',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  templateUrl: './settings.html',
  styleUrls: ['./settings.css']
})
export class Settings implements OnInit {
  activeTab = 'account';
  isLoading = true;
  accountData: any = {};
  preferencesData: any = {};
  privacyData: any = {};
  passwordData: any = {};
  dashboardStats: any = {}; 

  private apiUrl = 'https://hossammourad-001-site1.ltempurl.com/api';
  private http = inject(HttpClient);
  private cdr = inject(ChangeDetectorRef);

  ngOnInit() {
    this.loadAllSettings();
    this.loadDashboardStats(); 
  }

  private getHeaders() {
    const token = localStorage.getItem('token');

    return new HttpHeaders({ 'Authorization': `Bearer ${token}` });
  }

  loadAllSettings() {
    this.isLoading = true;
    this.http.get<any>(`${this.apiUrl}/Users/settings`, { headers: this.getHeaders() })
      .subscribe({
        next: (res) => {
          if (res) {
            this.accountData = res.account || {};
            this.preferencesData = res.preferences || {};
            this.privacyData = res.privacy || {};
          }
          this.isLoading = false;
          this.cdr.detectChanges(); 
        },
        error: (err) => {
          console.error('Error loading settings', err);
          this.isLoading = false;
          this.cdr.detectChanges();
        }
      });
  }

  loadDashboardStats() {
    this.http.get<any>(`${this.apiUrl}/Dashboard/stats`, { headers: this.getHeaders() })
      .subscribe({
        next: (res) => {
          if (res) {
            this.dashboardStats = res;
          }
          this.cdr.detectChanges();
        },
        error: (err) => console.error('Error loading dashboard stats', err)
      });
  }

  saveAccount() {
    this.http.put(`${this.apiUrl}/Users/account`, this.accountData, { headers: this.getHeaders() })
      .subscribe({
        next: (res: any) => alert(res.message || 'Account updated successfully!'),
        error: (err) => console.error('Error saving account', err)
      });
  }

  savePreferences() {
    this.http.put(`${this.apiUrl}/Users/preferences`, this.preferencesData, { headers: this.getHeaders() })
      .subscribe({
        next: (res: any) => alert(res.message || 'Preferences updated successfully!'),
        error: (err) => console.error('Error saving preferences', err)
      });
  }

  savePrivacy() {
    this.http.put(`${this.apiUrl}/Users/privacy`, this.privacyData, { headers: this.getHeaders() })
      .subscribe({
        next: (res: any) => alert(res.message || 'Privacy updated successfully!'),
        error: (err) => console.error('Error saving privacy', err)
      });
  }

  changePassword() {
    const payload = {
      currentPassword: this.passwordData.oldPassword,
      newPassword: this.passwordData.newPassword,
      confirmNewPassword: this.passwordData.newPassword 
    };

    this.http.put(`${this.apiUrl}/Users/change-password`, payload, { headers: this.getHeaders() })
      .subscribe({
        next: (res: any) => {
          alert(res.message || 'Password changed successfully!');
          this.passwordData = {}; 
        },
        error: (err) => console.error('Error changing password', err)
      });
  }

  syncAccounts() {
    this.http.post(`${this.apiUrl}/Users/sync-accounts`, {}, { headers: this.getHeaders() })
      .subscribe({
        next: (res: any) => alert(res.message || 'Sync triggered successfully!'),
        error: (err) => console.error('Error syncing accounts', err)
      });
  }

  deleteAccount() {
    if(confirm('Are you sure you want to delete your account? This action cannot be undone.')) {
      this.http.delete(`${this.apiUrl}/Users/delete-account`, { headers: this.getHeaders() })
        .subscribe({
          next: (res: any) => {
            alert(res.message || 'Account soft-deleted');
          },
          error: (err) => console.error('Error deleting account', err)
        });
    }
  }
}