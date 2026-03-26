import { Routes } from '@angular/router';
import { BodyFull } from './body-full/body-full';
import { Login } from './login/login';
import { DownloadComponent } from './download/download';
import { Register } from './register/register';
import { News } from './news/news';
// import { OtpValidationComponent } from './otp-validation/otpvalidation.component';
import { NewsComplete } from './news-complete/news-complete';
// import { GestioCuentaComponent } from './gestion-cuenta/gestion-cuenta.component';
// import { ShopsFullComponent } from './shop-full/shops-full.component';
import { RankingFull } from './ranking-full/ranking-full';
import { Evento } from './evento/evento';
import { Tienda } from './tienda/tienda';
import { ProfileComponent } from './profile/profile';
import { authGuard } from './guards/auth.guard';
import { Guide } from './guide/guide';
import { GuideComplete } from './guide-complete/guide-complete';




export const routes: Routes = [
  { path: '', component: BodyFull, data: { animation: 'HomePage' } },
  {
    path: 'login',
    component: Login,
    data: { animation: 'AboutPage' },
  },
  {
  path: 'profile',
  component: ProfileComponent,
  //canActivate: [authGuard],
  data: { animation: 'ProfilePage' },
},
  {
    path: 'download',
    component: DownloadComponent,
    data: { animation: 'DownloadPage' },
  },
  {
    path: 'news',
    component: News,
    data: { animation: 'NewsPage' },
  },
  {
    path: 'new/:infoNew',
    component: NewsComplete,
    data: { animation: 'NesOnePage' },
  },
  {
    path: 'ranking',
    component: RankingFull,
    data: { animation: 'RankignPage'}
  },
  {
    path: 'evento',
    component: Evento,
    data: { animation: 'EventoPage'}
  },

  /*{
  path: 'tienda',
  component: Tienda,
  data: { animation: 'TiendaPage' }
},*/
{
  path: 'foro',
  component: RankingFull, // TEMPORAL para probar
  data: { animation: 'ForoPage' }
},

  {
    path: 'register',
    component: Register,
    data: { animation: 'RegisterPage' },
  },
  {
    path: 'guide',
    component: Guide,
    data: { animation: 'GuidePage' },
  }, 
  {
    path: 'guide/:id',
    component: GuideComplete,
    data: { animation: 'GuideCompletePage' },
  },
//   {
//     path: 'shop',
//     component: ShopsFullComponent,
//     data: { animation: 'ShopPage' },
//   },

//   {
//     path: 'otpvalidation',
//     component: OtpValidationComponent,
//     data: { animation: 'OtpValidation' },
//   },
//   {
//     path: 'manage',
//     component: GestioCuentaComponent,
//     data: { animation: 'GestionAccount' },
//   },

  { path: '**', redirectTo: '' },
];

