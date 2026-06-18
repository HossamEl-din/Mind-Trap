import { Component, OnInit, inject, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { HttpClient, HttpHeaders } from '@angular/common/http';

export interface Mentor {
  id: number;
  userId?: number; 
  profileId?: string; 
  initials: string;
  avatarColor: string;
  name: string;
  role: string;
  rating: number;
  reviews: number;
  isVerified: boolean;
  level: string;
  levelColor: string;
  bio: string;
  studentsCount: string | number;
  experienceYears: number;
  subjects: string[];
  capacityCurrent: number;
  capacityMax: number;
  status: 'Available' | 'Full' | 'Requested' | 'Active' | string;
  isOnline: boolean;
  
  phone?: string;          
  phoneNumber?: string;
  whatsappLink?: string;
  whatsAppLink?: string;
  email?: string;
  linkedInProfile?: string;
}

@Component({
  selector: 'app-mentorship',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule],
  templateUrl: './mentorship.html',
  styleUrls: ['./mentorship.css']
})
export class MentorshipComponent implements OnInit {
  searchTerm: string = '';
  selectedLevel: string = 'All Levels'; 
  selectedStatus: string = 'All';

  private http = inject(HttpClient);
  private cdr = inject(ChangeDetectorRef);
  
  private baseUrl = 'http://hossammourad-001-site1.ltempurl.com/api/Mentorship';
  
  isModalOpen: boolean = false;
  selectedMentor: any = null;
  showStudents: boolean = false; 

  stats: any = { activeMentors: 0, students: 0, rating: 0 };
  
  pendingRequests: any[] = [];
  myStudents: any[] = [];
  myMentors: any[] = [];
  
  allMentors: Mentor[] = [];
  filteredMentors: Mentor[] = [];

  isApplyModalOpen: boolean = false;
  applyFormData = {
    fullName: '', jobTitle: '', phoneNumber: '', email: '', whatsappLink: '', linkedinProfile: '',
    level: '', maxStudents: '5', experienceYears: '', expertise: '', bio: ''
  };

  ngOnInit() {
    this.loadStats();
    this.loadMentors();
    this.loadPendingRequests();
    this.loadMyStudents();
    this.loadMyMentors();
  }

  private getHeaders() {
    const token = localStorage.getItem('token'); 
    return {
      headers: new HttpHeaders({
        'Authorization': `Bearer ${token}`
      })
    };
  }

  loadStats() {
    this.http.get<any>(`${this.baseUrl}/stats`, this.getHeaders()).subscribe({
      next: (res) => { 
        const data = res.data || res; 
        this.stats = {
          activeMentors: data.activeMentors || data.totalMentors || data.mentorsCount || 0,
          students: data.studentsHelped || data.totalStudents || data.studentsCount || data.students || 0,
          rating: data.avgRating || data.averageRating || data.rating || 0
        };
        this.cdr.detectChanges();
      },
      error: (err) => console.error('Error loading stats', err)
    });
  }

  loadMentors() {
    this.http.get<any>(`${this.baseUrl}/mentors`, this.getHeaders()).subscribe({
      next: (res) => { 
        const mentorsData = Array.isArray(res) ? res : (res.data || res.items || []);
        
        this.allMentors = mentorsData.map((m: any) => {
          
          const current = m.currentStudents || m.capacityCurrent || 0;
          const max = m.maxStudents || m.capacityMax || 5; 
          const isReallyFull = current >= max;

          const backendStatus = m.status || m.availabilityStatus || 'Available';

          let finalStatus = backendStatus;

          if (backendStatus.toLowerCase() !== 'requested' && 
              backendStatus.toLowerCase() !== 'active' && 
              backendStatus.toLowerCase() !== 'full') { 
              
              finalStatus = isReallyFull ? 'Full' : 'Available';
          }

          finalStatus = finalStatus.charAt(0).toUpperCase() + finalStatus.slice(1).toLowerCase();

          return {
            ...m,
            initials: m.name ? m.name.substring(0, 2).toUpperCase() : 'U',
            avatarColor: m.avatarColor || '#0F172A',
            rating: m.rating || 0,
            reviews: m.reviewCount || m.reviews || 0,
            experienceYears: m.experienceYears || 0,
            
            level: m.level || m.mentoringLevel || 'Level 1',
            
            capacityCurrent: current,
            capacityMax: max,
            status: finalStatus, 
            
            studentsCount: m.studentsHelped || current,
            subjects: m.expertiseTags || m.subjects || [],
            phoneNumber: m.phoneNumber || m.phone || null,
            email: m.email || null,
            whatsAppLink: m.whatsAppLink || null,       
            linkedInProfile: m.linkedInProfile || null   
          };
        });

        this.filteredMentors = [...this.allMentors];
        this.cdr.detectChanges(); 
      },
      error: (err) => console.error('Error loading mentors', err)
    });
  }

  submitApplication() {
    const payload = {
      fullName: this.applyFormData.fullName,
      jobTitle: this.applyFormData.jobTitle,
      phoneNumber: this.applyFormData.phoneNumber,
      email: this.applyFormData.email,
      whatsappLink: this.applyFormData.whatsappLink,
      linkedinProfile: this.applyFormData.linkedinProfile,
      level: this.applyFormData.level,
      maxStudents: Number(this.applyFormData.maxStudents) || 5,
      experienceYears: Number(this.applyFormData.experienceYears) || 0,
      expertise: this.applyFormData.expertise,
      bio: this.applyFormData.bio
    };

    this.http.post(`${this.baseUrl}/apply`, payload, this.getHeaders()).subscribe({
      next: () => {
        alert(' Application Submitted Successfully! Awaiting admin approval.');
        this.closeApplyModal();
      },
      error: (err) => {
        console.error('API Error Details:', err.error);
        const backendMessage = err.error?.message || 'Failed to submit application. Please try again.';
        alert(`${backendMessage}`); 
      }
    });
  }

  sendMentorshipRequest(mentor: Mentor) {
    const targetId = mentor.profileId || mentor.id; 

    if (!targetId) {
      alert(' فشل في إرسال الطلب: معرّف المينتور غير موجود.');
      return;
    }

    this.http.post(`${this.baseUrl}/request/${targetId}`, {}, this.getHeaders()).subscribe({
      next: () => {
        mentor.status = 'Requested';
        alert(' Request sent successfully!');
        this.closeModal();
      },
      error: (err) => {
        const errorMessage = err.error?.message || '';
        console.error('Failed to send request:', err);

        if (errorMessage.includes('maximum capacity')) {
          mentor.status = 'Full'; 
          alert(' عذراً، هذا المينتور وصل للحد الأقصى من الطلاب.');
        } 
        else if (errorMessage.includes('already have an active or pending request')) {
          mentor.status = 'Requested'; 
          alert(' لقد قمت بإرسال طلب لهذا المينتور مسبقاً.');
        } 
        else {
          alert(` Failed to send request: ${errorMessage || 'Server error'}`);
        }
      }
    });
  }

  loadMyMentors() {
    this.http.get<any>(`${this.baseUrl}/my-mentors`, this.getHeaders()).subscribe({
      next: (res) => { 
        const mentorsData = Array.isArray(res) ? res : (res.data || res.items || []);
        
        this.myMentors = mentorsData.map((m: any) => {
          const data = m.mentor || m.mentorProfile || m;
          const mentorName = data.name || data.mentorName || data.fullName || 'Unknown Mentor';
          
          let phoneVal = data.phoneNumber || data.phone || data.whatsappLink || m.phoneNumber || m.phone || m.whatsappLink;
          let emailVal = data.email || data.contactEmail || m.email || m.contactEmail;

          let rawPhone = phoneVal ? String(phoneVal) : '';
          let rawEmail = emailVal ? String(emailVal) : '';

          let correctEmail = rawEmail.includes('@') ? rawEmail : (rawPhone.includes('@') ? rawPhone : null);
          let correctPhone = (!rawPhone.includes('@') && rawPhone) ? rawPhone : ((!rawEmail.includes('@') && rawEmail) ? rawEmail : null);

          return {
            ...m,
            ...data,
            name: mentorName,
            initials: mentorName ? mentorName.substring(0, 2).toUpperCase() : 'MN',
            avatarColor: data.avatarColor || '#7B2EFF', 
            level: data.mentoringLevel || data.level || 'Level 1',
            status: m.status || data.status || 'Active',
            phone: correctPhone, 
            email: correctEmail
          };
        });

        this.cdr.detectChanges();
      },
      error: (err) => console.error('Error loading my mentors', err)
    });
  }
  
  rateMentor(mentorId: number, score: number) {
    const payload = { score: score }; 
    
    this.http.post(`${this.baseUrl}/mentors/${mentorId}/rate`, payload, this.getHeaders()).subscribe({
      next: () => {
        alert(' Thank you for rating your mentor!');
        this.loadStats(); 
      },
      error: (err) => console.error('Failed to rate mentor', err)
    });
  }

  loadPendingRequests() {
    this.http.get<any>(`${this.baseUrl}/requests/pending`, this.getHeaders()).subscribe({
      next: (res) => { 
        const requestsData = Array.isArray(res) ? res : (res.data || res.items || []);
        
        this.pendingRequests = requestsData.map((req: any) => {
          const studentName = req.studentName || req.name || req.userName || req.fullName || 'Unknown Student';
          
          return {
            ...req,
            connectionId: req.connectionId || req.id, 
            name: studentName,
            initials: studentName ? studentName.substring(0, 2).toUpperCase() : 'UN',
            level: req.level || req.studentLevel || 'Student',
            time: req.time || req.requestDate || 'New Request'
          };
        });

        this.cdr.detectChanges();
      },
      error: (err) => console.error('Error loading pending requests', err)
    });
  }

  acceptRequest(connectionId: number) {
    this.http.put(`${this.baseUrl}/requests/${connectionId}/accept`, {}, this.getHeaders()).subscribe({
      next: () => {
        this.pendingRequests = this.pendingRequests.filter(req => req.connectionId !== connectionId);
        this.loadMyStudents(); 
        alert(' Request Accepted!');
      },
      error: (err) => alert('Failed to accept request.')
    });
  }

  rejectRequest(connectionId: number) {
    this.http.put(`${this.baseUrl}/requests/${connectionId}/reject`, {}, this.getHeaders()).subscribe({
      next: () => {
        this.pendingRequests = this.pendingRequests.filter(req => req.connectionId !== connectionId);
      },
      error: (err) => alert('Failed to reject request.')
    });
  }

  loadMyStudents() {
    this.http.get<any>(`${this.baseUrl}/my-students`, this.getHeaders()).subscribe({
      next: (res) => { 
        const studentsData = Array.isArray(res) ? res : (res.data || res.items || []);
        
        this.myStudents = studentsData.map((stu: any) => {
          const studentName = stu.name || stu.studentName || stu.fullName || stu.userName || 'Unknown Student';
          return {
            ...stu,
            name: studentName,
            initials: studentName ? studentName.substring(0, 2).toUpperCase() : 'ST',
            avatarColor: stu.avatarColor || '#00ff88', 
            level: stu.level || stu.studentLevel || 'Student',
            since: stu.since || stu.date || 'Recently'
          };
        });

        this.cdr.detectChanges();
      },
      error: (err) => console.error('Error loading my students', err)
    });
  }

  endMentorship(mentor: any) {
    const connectionId = mentor.connectionId || mentor.id;
    
    if(confirm('Are you sure you want to end this mentorship?')) {
      this.http.put(`${this.baseUrl}/requests/${connectionId}/end`, {}, this.getHeaders()).subscribe({
        next: () => {
          this.myMentors = this.myMentors.filter(m => (m.connectionId || m.id) !== connectionId);
          this.loadStats(); 
          alert(' Mentorship ended successfully.');

          const rating = prompt('Please rate your mentor from 1 to 5:');
          if (rating && !isNaN(Number(rating))) {
             const score = Math.min(Math.max(Number(rating), 1), 5);
             const mentorId = mentor.mentorId || mentor.profileId || mentor.id; 
             if(mentorId) {
                this.rateMentor(mentorId, score);
             }
          }
        },
        error: (err) => alert(' Failed to end mentorship.')
      });
    }
  }

  toggleStudentsSection() { this.showStudents = !this.showStudents; }
  
  openContactModal(mentor: any) { 
    const idToFind = mentor.mentorId || mentor.id || mentor.profileId;
    const fullMentorData = this.allMentors.find(m => 
      m.id === idToFind || 
      m.userId === idToFind || 
      m.profileId === idToFind
    );

    const finalPhone = mentor.phone || mentor.phoneNumber ||
                       (fullMentorData ? fullMentorData.phoneNumber : null);
    const finalWhatsapp = mentor.whatsapp || mentor.whatsAppLink || 
                          (fullMentorData ? fullMentorData.whatsAppLink : null);
                          
    const finalLinkedin = mentor.linkedin || mentor.linkedInProfile || 
                          (fullMentorData ? fullMentorData.linkedInProfile : null);

    this.selectedMentor = {
      ...mentor,
      phone: finalPhone || 'Not Provided',
      email: mentor.email || (fullMentorData ? fullMentorData.email : null) || 'Not Provided',
      whatsapp: finalWhatsapp,
      linkedin: finalLinkedin
    };
    
    this.isModalOpen = true; 
  }

  copyToClipboard(text: string | undefined) {
    if (!text || text === 'Not Provided') return;
    navigator.clipboard.writeText(text).then(() => {
      console.log('Copied to clipboard: ', text);
    }).catch(err => console.error('Could not copy text: ', err));
  }

  openLink(url: string | undefined, type: string) {
    if (!url) return;
    let finalUrl = url;
    
    if (!url.startsWith('http') && !url.startsWith('https')) {
      if (type === 'whatsapp') {
        const digitsOnly = url.replace(/[^0-9]/g, '');
        if (digitsOnly.length >= 10) {
            finalUrl = `https://wa.me/${digitsOnly}`;
        } else {
            finalUrl = `https://${url}`;
        }
      } else {
        finalUrl = `https://${url}`;
      }
    }
    window.open(finalUrl, '_blank');
  }

  closeModal() { this.isModalOpen = false; this.selectedMentor = null; }
  openApplyModal() { this.isApplyModalOpen = true; }
  closeApplyModal() { this.isApplyModalOpen = false; }
  selectLevel(level: string) { this.applyFormData.level = level; }

  setStatusFilter(status: string) {
    this.selectedStatus = status;
    this.filterMentors(); 
  }
  filterMentors() {
    let result = this.allMentors;
    
    if (this.searchTerm && this.searchTerm.trim() !== '') {
      const term = this.searchTerm.toLowerCase().trim();
      result = result.filter(mentor => 
        (mentor.name && mentor.name.toLowerCase().includes(term)) ||
        (mentor.subjects && mentor.subjects.some(sub => sub.toLowerCase().includes(term)))
      );
    }

    if (this.selectedLevel !== 'All Levels') {
      const targetLevel = this.selectedLevel.toLowerCase().trim();
      result = result.filter(mentor => {
        const backendLevel = (mentor.level || '').toLowerCase().trim();
        return backendLevel === targetLevel;
      });
    }
    if (this.selectedStatus !== 'All') {
      result = result.filter(mentor => 
        mentor.status && mentor.status.toLowerCase() === this.selectedStatus.toLowerCase()
      );
    }

    this.filteredMentors = result;
  }
}