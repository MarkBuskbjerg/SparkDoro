import { vi } from 'vitest'
import React from 'react'

type GenericProps = Record<string, unknown> & { children?: React.ReactNode }

function block(tag: keyof JSX.IntrinsicElements) {
  return ({ children, ...props }: GenericProps) => React.createElement(tag, props, children)
}

vi.mock('@ionic/react', () => {
  return {
    setupIonicReact: () => undefined,
    IonApp: block('div'),
    IonPage: block('div'),
    IonContent: block('main'),
    IonHeader: block('header'),
    IonToolbar: block('div'),
    IonTitle: block('h1'),
    IonButtons: block('div'),
    IonIcon: block('span'),
    IonCard: block('section'),
    IonCardContent: block('div'),
    IonText: block('p'),
    IonItem: block('label'),
    IonLabel: block('span'),
    IonButton: ({ children, ...props }: GenericProps) => React.createElement('button', props, children),
    IonModal: ({ children, isOpen }: GenericProps & { isOpen?: boolean }) =>
      isOpen ? React.createElement('div', null, children) : null,
    IonPopover: ({ children, isOpen }: GenericProps & { isOpen?: boolean }) =>
      isOpen ? React.createElement('div', null, children) : null,
    IonToggle: ({ checked, onIonChange, ...props }: GenericProps) =>
      React.createElement('input', {
        ...props,
        type: 'checkbox',
        checked: Boolean(checked),
        onChange: (event: Event) =>
          typeof onIonChange === 'function' &&
          onIonChange({
            detail: { checked: (event.target as HTMLInputElement).checked },
          }),
      }),
    IonSelect: ({ value, onIonChange, children, ...props }: GenericProps) =>
      React.createElement(
        'select',
        {
          ...props,
          value: value as string,
          onChange: (event: Event) =>
            typeof onIonChange === 'function' &&
            onIonChange({
              detail: { value: (event.target as HTMLSelectElement).value },
            }),
        },
        children,
      ),
    IonSelectOption: ({ children, ...props }: GenericProps) =>
      React.createElement('option', props, children),
    IonInput: ({ value, onIonChange, ...props }: GenericProps) =>
      React.createElement('input', {
        ...props,
        value: value as string | number | undefined,
        onChange: (event: Event) =>
          typeof onIonChange === 'function' &&
          onIonChange({
            detail: { value: (event.target as HTMLInputElement).value },
          }),
      }),
    IonSegment: block('div'),
    IonSegmentButton: block('button'),
    IonDatetime: ({ value, ...props }: GenericProps) =>
      React.createElement('input', {
        ...props,
        value: value as string | undefined,
        type: 'date',
      }),
  }
})

vi.mock('recharts', () => {
  return {
    ResponsiveContainer: block('div'),
    AreaChart: block('div'),
    CartesianGrid: block('div'),
    XAxis: block('div'),
    YAxis: block('div'),
    Tooltip: block('div'),
    Area: block('div'),
  }
})
