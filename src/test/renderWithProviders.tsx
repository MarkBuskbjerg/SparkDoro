import { type PropsWithChildren, type ReactElement } from 'react'
import { render } from '@testing-library/react'
import { IonApp } from '@ionic/react'
import { MemoryRouter } from 'react-router-dom'
import '../i18n'

function Wrapper({ children }: PropsWithChildren) {
  return (
    <IonApp>
      <MemoryRouter>{children}</MemoryRouter>
    </IonApp>
  )
}

export function renderWithProviders(element: ReactElement) {
  return render(element, { wrapper: Wrapper })
}
