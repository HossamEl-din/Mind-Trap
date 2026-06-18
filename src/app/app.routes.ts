import { Routes } from '@angular/router';
import { Home } from './pages/home/home';
import { Login } from './pages/login/login';
import { Register } from './pages/register/register';

import { Settings } from './pages/settings/settings';
import { LearningPath } from './pages/learning-path/learning-path';
import { TopicDetail } from './pages/learning-path/topic-detail';
import { Problems } from './pages/problems/problems.component';
import { Contests } from './pages/contests/contests';
import { Dashboard } from './pages/dashboard/dashboard';
import { ChallengesComponent } from './pages/challenges/challenges';
import { MentorshipComponent } from './pages/mentorship/mentorship';// الاستيراد الصح لصفحة تفاصيل المسألة باسم الكلاس المظبوط (ProblemDetail)
import { ProblemDetail } from './pages/problems/problem-detail/problem-detail.component'; 

export const routes: Routes = [
  { path: '', component: Home },
  
  { path: 'login', component: Login },
  { path: 'register', component: Register },
  { path: 'settings', component: Settings },
  { path: 'learning-path', component: LearningPath },
  { path: 'topic/:id', component: TopicDetail }, 
  
  { path: 'problems', component: Problems },

  // السطر اللي هيخلي زرار "Go to Battle" يفتح صفحة الكود بالـ ID المظبوط
  { path: 'problems/:id', component: ProblemDetail }, 

  { path: 'contests', component: Contests },
  { path: 'dashboard', component: Dashboard },
  { path: 'challenges', component: ChallengesComponent },
{ path: 'mentorship', component: MentorshipComponent },];