import { Component, signal, OnInit, inject, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule, Router } from '@angular/router';
import { ChallengeService } from './challenge.service';

@Component({
  selector: 'app-challenges',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  templateUrl: './challenges.html',
  styleUrl: './challenges.css'
})
export class ChallengesComponent implements OnInit {
  private challengeService = inject(ChallengeService);
  private cdr = inject(ChangeDetectorRef); 
  private router = inject(Router);

  activeTab = signal<string>('Active');
  lbFilter = signal<string>('This Week');
  
  showCreateModal = signal(false);
  newChallenge = { opponent: '', topic: 'Random', difficulty: 'Random', timeLimit: 45 };

  showDetailsModal = signal(false);
  selectedChallenge: any = null;

  tabs = ['Active', 'Pending', 'Completed'];

  stats: any[] = [];
  challenges: any[] = [];
  leaderboard: any[] = [];

  ngOnInit() {
    this.loadStats();
    this.loadTabData(this.activeTab());
    this.loadLeaderboard();
  }

  setTab(tab: string) { 
    this.activeTab.set(tab); 
    this.loadTabData(tab);
  }

  setLbFilter(f: string) { 
    this.lbFilter.set(f); 
    this.loadLeaderboard();
  }

  openCreateChallenge() { this.showCreateModal.set(true); }
  closeCreateChallenge() { this.showCreateModal.set(false); }

  openDetails(challenge: any) {
    this.selectedChallenge = challenge;
    this.showDetailsModal.set(true);
  }

  closeDetails() {
    this.showDetailsModal.set(false);
    this.selectedChallenge = null;
  }

  loadStats() {
    this.challengeService.getStats().subscribe({
      next: (res) => {
        this.stats = [
          { value: res.totalBattles?.toString() || '0', label: 'Total Battles' },
          { value: res.totalWins?.toString() || '0', label: 'Total Wins' },
          { value: `${Math.round((res.totalWins / res.totalBattles) * 100) || 0}%`, label: 'Win Rate' },
          { value: res.winStreak?.toString() || '0', label: 'Win Streak' },
          { value: res.points?.toString() || '0', label: 'Battle Points' }
        ];
        this.cdr.detectChanges(); 
      },
      error: (err) => console.error('Error loading stats', err)
    });
  }

  loadTabData(tab: string) {
    this.challenges = []; 
    
    if (tab === 'Active') {
      this.challengeService.getActiveChallenges().subscribe(res => {
        this.challenges = res.map(c => this.mapUI(c, '1V1 BATTLE', 'ACTIVE'));
        this.cdr.detectChanges(); 
      });
    } else if (tab === 'Pending') {
      this.challengeService.getPendingChallenges().subscribe(res => {
        this.challenges = res.map(c => this.mapUI(c, '1V1 BATTLE', 'PENDING'));
        this.cdr.detectChanges(); 
      });
    } else if (tab === 'Completed') {
      this.challengeService.getCompletedChallenges().subscribe(res => {
        this.challenges = res.map(c => this.mapUI(c, '1V1 BATTLE', 'COMPLETED'));
        this.cdr.detectChanges(); 
      });
    }
  }

  loadLeaderboard() {
    this.challengeService.getLeaderboard(10).subscribe({
      next: (res) => {
        this.leaderboard = res.map((user, index) => ({
          rank: index + 1,
          initials: user.username ? user.username.substring(0, 2).toUpperCase() : '??',
          name: user.username || 'Unknown',
          sub: `${user.totalWins} Wins • Challenger`, 
          points: user.points?.toString() || '0',
          color: index === 0 ? '#fbbf24' : index === 1 ? '#e5e7eb' : index === 2 ? '#d97706' : (index % 2 === 0 ? '#d946ef' : '#0ea5e9')
        }));
        this.cdr.detectChanges(); 
      },
      error: (err) => console.error('Error loading leaderboard', err)
    });
  }

  private mapUI(apiData: any, typeTag: string, statusTag: string) {
    return {
      id: apiData.id,
      problemId: apiData.problemId, 
      title: apiData.title || 'Coding Challenge',
      typeTag: typeTag,
      statusTag: statusTag,
      isWinner: apiData.isWinner,
      p1: { initials: 'MA', name: 'Manar (You)', sub: 'Ready', color: '#3b82f6' },
      p2: { 
        initials: apiData.opponentName ? apiData.opponentName.substring(0, 2).toUpperCase() : '??', 
        name: apiData.opponentName || 'Opponent', 
        sub: statusTag === 'PENDING' && apiData.role === 'Sent' ? 'Awaiting...' : 'Ready', 
        color: '#f59e0b' 
      },
      btn1: statusTag === 'COMPLETED' ? 'Rematch' : (statusTag === 'PENDING' ? (apiData.role === 'Received' ? 'Accept' : 'Waiting...') : 'Go to Battle'),
      btn2: 'View Details'
    };
  }

  handlePrimaryAction(challenge: any) {
    if (challenge.btn1 === 'Accept') {
      this.challengeService.acceptChallenge(challenge.id).subscribe({
        next: (res) => {
          alert(res.message || 'Challenge Accepted! Battle starts now.');
          if (res.problemId) {
            this.router.navigate(['/problems', res.problemId], { queryParams: { challengeId: challenge.id } }); 
          } else {
            this.setTab('Active'); 
          }
        },
        error: (err) => {
          console.error('Error accepting challenge', err);
          alert('Failed to accept challenge.');
        }
      });
    } else if (challenge.btn1 === 'Go to Battle') {
      
      
      const targetProblemId = challenge.problemId || challenge.id; 
      
      this.router.navigate(['/problems', targetProblemId], { queryParams: { challengeId: challenge.id } }); 

    } else if (challenge.btn1 === 'Waiting...') {
      alert('Waiting for opponent to accept...');
    }
  }

  createChallenge() {
    const payload = {
      title: this.newChallenge.topic === 'Random' ? 'Random Battle' : `${this.newChallenge.topic} Battle`,
      difficulty: this.newChallenge.difficulty === 'Random' ? 'Medium' : this.newChallenge.difficulty,
      topicTag: this.newChallenge.topic === 'Random' ? 'General' : this.newChallenge.topic,
      durationMinutes: Number(this.newChallenge.timeLimit),
      opponentUsername: this.newChallenge.opponent ? this.newChallenge.opponent : null
    };

    this.challengeService.createChallenge(payload).subscribe({
      next: (res) => {
        console.log('تم إنشاء التحدي بنجاح!', res);
        
        this.closeCreateChallenge();
        this.newChallenge = { opponent: '', topic: 'Random', difficulty: 'Random', timeLimit: 45 };
        
        this.activeTab.set('Active');
        this.loadTabData('Active'); 
      },
      error: (err) => {
        console.error('حصل خطأ أثناء إنشاء التحدي:', err);
        alert('حدث خطأ أثناء الإنشاء، راجعي الـ Console للتفاصيل.');
      }
    });
  }
}