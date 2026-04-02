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
import { Shop } from './shop/shop';
import { ShopCart } from './shop-cart/shop-cart';
import { ShopProductComponent } from './shop-product/shop-product';
import { ShopPaymentResult } from './shop-payment-result/shop-payment-result';
import { ShopOrderHistory } from './shop-order-history/shop-order-history';
import { AdminLayout } from './admin/admin-layout';
import { AdminPlaceholder } from './admin/admin-placeholder';
import { adminGuard } from './guards/admin.guard';
import { AdminPurchases } from './admin/admin-purchases';
import { AdminAffiliateLiquidations } from './admin/admin-affiliate-liquidations';
import { ReferidosComponent } from './referidos/referidos';




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

  {
  path: 'shop',
  component: Shop,
  data: { animation: 'ShopPage' }
},
{
  path: 'shop-cart',
  component: ShopCart,
  data: { animation: 'ShopCartPage' }
},
{
  path: 'shop-history',
  component: ShopOrderHistory,
  data: { animation: 'ShopHistoryPage' }
},
{
  path: 'referidos',
  component: ReferidosComponent,
  data: { animation: 'ReferidosPage' }
},
{
  path: 'shop-product/:id',
  component: ShopProductComponent,
  data: { animation: 'ShopProductPage' }
},
{
  path: 'shop/payment/approved',
  component: ShopPaymentResult,
  data: { animation: 'ShopPaymentApprovedPage', status: 'approved' }
},
{
  path: 'shop/payment/rejected',
  component: ShopPaymentResult,
  data: { animation: 'ShopPaymentRejectedPage', status: 'rejected' }
},
{
  path: 'shop/payment/pending',
  component: ShopPaymentResult,
  data: { animation: 'ShopPaymentPendingPage', status: 'pending' }
},
{
  path: 'admin',
  component: AdminLayout,
  canActivate: [adminGuard],
  children: [
    {
      path: '',
      pathMatch: 'full',
      redirectTo: 'compras',
    },
    {
      path: 'compras',
      component: AdminPurchases,
      data: {
        animation: 'AdminComprasPage',
      },
    },
    {
      path: 'codigos',
      component: AdminPlaceholder,
      data: {
        animation: 'AdminCodigosPage',
        title: 'Codigos & Afiliados',
        description: 'Modulo listo para migrar la gestion de codigos promocionales y afiliados.',
      },
    },
    {
      path: 'liquidaciones',
      component: AdminAffiliateLiquidations,
      data: {
        animation: 'AdminLiquidacionesPage',
      },
    },
    {
      path: 'ventas/diarias',
      component: AdminPlaceholder,
      data: {
        animation: 'AdminVentasDiariasPage',
        title: 'Ventas Diarias',
        description: 'Vista preparada para mostrar el consolidado de ventas por dia.',
      },
    },
    {
      path: 'clientes',
      component: AdminPlaceholder,
      data: {
        animation: 'AdminClientesPage',
        title: 'Top Clientes',
        description: 'Este modulo mostrara el ranking y analitica de clientes principales.',
      },
    },
    {
      path: 'logs/intercambios',
      component: AdminPlaceholder,
      data: {
        animation: 'AdminLogsIntercambiosPage',
        title: 'Logs Intercambios',
        description: 'Seccion reservada para los logs nuevos de intercambios.',
      },
    },
    {
      path: 'intercambios',
      component: AdminPlaceholder,
      data: {
        animation: 'AdminIntercambiosOldPage',
        title: 'Logs Intercambios (OLD)',
        description: 'Aqui migramos la version antigua del modulo de intercambios.',
      },
    },
    {
      path: 'logs',
      component: AdminPlaceholder,
      data: {
        animation: 'AdminLogsPage',
        title: 'Logs Servidor',
        description: 'Modulo base para explorar y administrar los logs del servidor.',
      },
    },
  ],
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

