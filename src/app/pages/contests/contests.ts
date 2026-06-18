import { Component, OnInit, OnDestroy, inject, NgZone, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { HttpClient, HttpHeaders } from '@angular/common/http';

interface Contest {
  id: number;
  title: string;
  platform: string;
  status: string;
  startTime: string | Date;
  endTime: string | Date;
  duration: string;
  url: string; 
  participantCount: number | null;
  registered: boolean;
  isLive?: boolean;
  timeRemainingStr?: string; 
}

@Component({
  selector: 'app-contests',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './contests.html',
  styleUrl: './contests.css',
})
export class Contests implements OnInit, OnDestroy {
  activeFilter = 'All Platforms';
  filters = ['All Platforms', 'Codeforces', 'LeetCode', 'AtCoder', 'CodeChef'];

  currentMonth = ''; 
  calendarDays: { day: number | null; contests: any[] }[] = [];
  selectedDay: number | null = null; 

  private timerInterval: any;
  private http = inject(HttpClient);
  private zone = inject(NgZone);
  private cdr = inject(ChangeDetectorRef); 
  
  private apiUrl = 'https://hossammourad-001-site1.ltempurl.com/api/Contests';

  allContests: Contest[] = [];
  currentDisplayDate = new Date(); 

  private getHeaders() {
    const token = localStorage.getItem('token');
    return new HttpHeaders({
      'Authorization': `Bearer ${token}`
    });
  }

  ngOnInit() {
    this.loadContests();
    this.buildCalendarGrid(this.currentDisplayDate.getFullYear(), this.currentDisplayDate.getMonth()); 
    
    this.timerInterval = setInterval(() => {
      this.updateTimers();
      this.cdr.detectChanges();
    }, 1000);
  }

  ngOnDestroy() {
    if (this.timerInterval) clearInterval(this.timerInterval);
  }

  private parseCustomDate(dateStr: string | Date): Date {
    if (typeof dateStr !== 'string') return dateStr as Date;
    
    const parts = dateStr.match(/(\d{4})-(\d{2})-(\d{2}) (\d{2}):(\d{2}) (AM|PM)/i);
    if (parts) {
      const [_, year, month, day, hours, minutes, ampm] = parts;
      let hrs = parseInt(hours, 10);
      if (ampm.toUpperCase() === 'PM' && hrs < 12) hrs += 12;
      if (ampm.toUpperCase() === 'AM' && hrs === 12) hrs = 0;
      
      return new Date(parseInt(year, 10), parseInt(month, 10) - 1, parseInt(day, 10), hrs, parseInt(minutes, 10));
    }
    
    return new Date(dateStr); 
  }

  loadContests() {
    this.http.get<Contest[]>(this.apiUrl, { headers: this.getHeaders() }).subscribe({
      next: (res) => {
        this.zone.run(() => {
          this.allContests = res.map(c => ({
            ...c,
        
            startTime: this.parseCustomDate(c.startTime),
            endTime: this.parseCustomDate(c.endTime),
            isLive: c.status === 'LIVE' || c.status === 'Live',
            timeRemainingStr: '00:00:00'
          }));

          this.updateTimers();
          this.updateCalendarDots();
          this.cdr.detectChanges();
        });
      },
      error: (err) => console.error('Error loading contests:', err)
    });
  }

  updateTimers() {
    const now = Date.now();
    this.allContests.forEach(contest => {
      const start = contest.startTime as Date;
      const diff = start.getTime() - now;
      
      if (diff <= 0) {
        contest.timeRemainingStr = '00:00:00';
      } else {
        const h = Math.floor(diff / 3600000);
        const m = Math.floor((diff % 3600000) / 60000);
        const s = Math.floor((diff % 60000) / 1000);
        
        if (h >= 24) {
          contest.timeRemainingStr = `${Math.floor(h / 24)}d ${h % 24}h ${m}m`;
        } else {
          contest.timeRemainingStr = `${String(h).padStart(2,'0')}:${String(m).padStart(2,'0')}:${String(s).padStart(2,'0')}`;
        }
      }
    });
  }

  buildCalendarGrid(year: number, monthIndex: number) {
    const monthNames = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
    this.currentMonth = `${monthNames[monthIndex]} ${year}`;

    const days = [];
    const firstDay = new Date(year, monthIndex, 1).getDay();
    const totalDays = new Date(year, monthIndex + 1, 0).getDate();

    for (let i = 0; i < firstDay; i++) {
      days.push({ day: null, contests: [] });
    }

    for (let d = 1; d <= totalDays; d++) {
      days.push({ day: d, contests: [] });
    }
    
    this.calendarDays = days;
    this.updateCalendarDots();
  }

  updateCalendarDots() {
    if (!this.calendarDays || this.allContests.length === 0) return;

    this.calendarDays.forEach(dayObj => {
      if (dayObj.day) {
        dayObj.contests = this.allContests.filter(c => {
          const start = c.startTime as Date;
          const isSameDay = start.getDate() === dayObj.day && 
                            start.getMonth() === this.currentDisplayDate.getMonth() && 
                            start.getFullYear() === this.currentDisplayDate.getFullYear();
          
          const matchesPlatform = this.activeFilter === 'All Platforms' || c.platform === this.activeFilter;
          
          return isSameDay && matchesPlatform; 
        });
      }
    });
  }

  setFilter(filter: string) {
    if (this.activeFilter === filter) return; 
    this.activeFilter = filter;
    
    this.zone.run(() => {
      this.selectedDay = null; 
      this.updateCalendarDots(); 
      this.cdr.detectChanges();
    });
  }

  selectDay(day: number | null) {
    if (!day) return;
    this.selectedDay = this.selectedDay === day ? null : day;
    this.zone.run(() => {
      this.cdr.detectChanges();
    });
  }

  toggleRegister(contest: any) {
    this.http.post(`${this.apiUrl}/${contest.id}/remind`, {}, { headers: this.getHeaders() }).subscribe({
      next: () => {
        this.zone.run(() => {
          contest.registered = true;
          this.cdr.detectChanges();
        });
      },
      error: (err) => console.error('Error updating reminder:', err)
    });
  }

  nextMonth() {
    this.zone.run(() => {
      this.currentDisplayDate.setMonth(this.currentDisplayDate.getMonth() + 1);
      this.selectedDay = null; 
      this.buildCalendarGrid(this.currentDisplayDate.getFullYear(), this.currentDisplayDate.getMonth());
    });
  }

  prevMonth() {
    this.zone.run(() => {
      this.currentDisplayDate.setMonth(this.currentDisplayDate.getMonth() - 1);
      this.selectedDay = null;
      this.buildCalendarGrid(this.currentDisplayDate.getFullYear(), this.currentDisplayDate.getMonth());
    });
  }

  syncContests() {
    this.http.post(`${this.apiUrl}/sync`, {}, { headers: this.getHeaders() }).subscribe({
      next: () => {
        alert('✅ Contests synchronized successfully!');
        this.loadContests();
      },
      error: (err) => alert('❌ Failed to sync contests.')
    });
  }

  get liveContest(): Contest | undefined {
    return this.allContests.find(c => c.isLive);
  }

  get filteredContests(): Contest[] {
    const nonLive = this.allContests.filter(c => !c.isLive);
    let filtered = this.activeFilter === 'All Platforms' ? nonLive : nonLive.filter(c => c.platform === this.activeFilter);

    if (this.selectedDay) {
      filtered = filtered.filter(c => {
        const start = c.startTime as Date;
        return start.getDate() === this.selectedDay && 
               start.getMonth() === this.currentDisplayDate.getMonth() && 
               start.getFullYear() === this.currentDisplayDate.getFullYear();
      });
    }

    return filtered.filter(c => {
      const start = c.startTime as Date;
      return start.getTime() > Date.now();
    });
  }

  getPlatformColor(platform: string): string {
    const colors: any = { 'Codeforces': '#1a73e8', 'LeetCode': '#FFA500', 'AtCoder': '#8B5CF6', 'CodeChef': '#00C853' };
    return colors[platform] || '#00D9FF';
  }

  getPlatformLetter(platform: string): string {
    return platform === 'Codeforces' ? 'CF' : platform === 'LeetCode' ? 'LC' : platform === 'AtCoder' ? 'AC' : 'CC';
  }
}