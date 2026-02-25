import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
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


const routes: Routes = [
  { path: '', component: BodyFull, data: { animation: 'HomePage' } },
  {
    path: 'login',
    component: Login,
    data: { animation: 'AboutPage' },
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
    path: 'register',
    component: Register,
    data: { animation: 'RegisterPage' },
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
@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule],
})
export class AppRoutingModule {}
