import { Routes } from '@angular/router';
import { Home } from './pages/home/home';
import { Settings } from './pages/settings/settings';
import { LearningPath } from './pages/learning-path/learning-path';
import { TopicDetail } from './pages/learning-path/topic-detail';
import { Problems } from './pages/problems/problems.component';
import { Contests } from './pages/contests/contests';

export const routes: Routes = [
  { path: '', component: Home },
  { path: 'settings', component: Settings },
  { path: 'learning-path', component: LearningPath },
  { path: 'topic/:key', component: TopicDetail },
  { path: 'problems', component: Problems },
  { path: 'contests', component: Contests },
]
