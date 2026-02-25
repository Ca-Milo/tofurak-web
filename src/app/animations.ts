import {
  animate,
  group,
  query,
  style,
  transition,
  trigger
} from '@angular/animations';

export const slideInAnimation = trigger('slideInAnimation', [

  transition('* <=> *', [

    // Preparación
    query(':enter, :leave', [
      style({
        position: 'fixed',
        width: '100%',
        height: '100%',
        top: 0,
        left: 0,
        background: '#fff' // 🔑 evita fondo negro
      })
    ], { optional: true }),

    group([

      // SALIENTE
      query(':leave', [
        style({
          transform: 'translateX(0)',
          opacity: 1,
          zIndex: 2
        }),
        animate(
          '350ms cubic-bezier(0.4, 0.0, 0.2, 1)',
          style({
            transform: 'translateX(40px)',
            opacity: 0
          })
        )
      ], { optional: true }),

      // ENTRANTE
      query(':enter', [
        style({
          transform: 'translateX(-40px)',
          opacity: 0,
          zIndex: 1
        }),
        animate(
          '400ms cubic-bezier(0.4, 0.0, 0.2, 1)',
          style({
            transform: 'translateX(0)',
            opacity: 1
          })
        )
      ], { optional: true })

    ])
  ])
]);
