import React from 'react'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import {
  Drawer,
  DrawerTrigger,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
  DrawerDescription,
  DrawerClose,
} from '../Drawer'

beforeAll(() => {
  Object.defineProperty(window, 'matchMedia', {
    writable: true,
    value: jest.fn((query: string) => ({
      matches: false,
      media: query,
      onchange: null,
      addListener: jest.fn(),
      removeListener: jest.fn(),
      addEventListener: jest.fn(),
      removeEventListener: jest.fn(),
      dispatchEvent: jest.fn(),
    })),
  })

  window.HTMLElement.prototype.setPointerCapture = jest.fn()
  window.HTMLElement.prototype.releasePointerCapture = jest.fn()
  window.HTMLElement.prototype.hasPointerCapture = jest.fn(() => false)

  Object.defineProperty(window, 'getComputedStyle', {
    writable: true,
    value: () => ({
      transform: 'none',
      getPropertyValue: () => '',
    }),
  })
})

function ControlledDrawer() {
  const [open, setOpen] = React.useState(false)
  return (
    <Drawer open={open} onOpenChange={setOpen}>
      <DrawerTrigger asChild>
        <button data-testid="drawer-open">Open</button>
      </DrawerTrigger>
      <DrawerContent>
        <DrawerHeader>
          <DrawerTitle data-testid="drawer-title">Title</DrawerTitle>
          <DrawerDescription data-testid="drawer-description">
            Description
          </DrawerDescription>
        </DrawerHeader>
        <DrawerClose asChild>
          <button data-testid="drawer-close" onClick={() => setOpen(false)}>
            Close
          </button>
        </DrawerClose>
      </DrawerContent>
    </Drawer>
  )
}

// Tests

describe('Drawer component', () => {
  it('renders the trigger and opens the drawer on click', async () => {
    const user = userEvent.setup()

    render(
      <Drawer>
        <DrawerTrigger asChild>
          <button data-testid="drawer-open">Open</button>
        </DrawerTrigger>
        <DrawerContent>
          <DrawerHeader>
            <DrawerTitle data-testid="drawer-title">Title</DrawerTitle>
            <DrawerDescription data-testid="drawer-description">
              Description
            </DrawerDescription>
          </DrawerHeader>
          <DrawerClose asChild>
            <button data-testid="drawer-close">Close</button>
          </DrawerClose>
        </DrawerContent>
      </Drawer>
    )

    expect(screen.getByTestId('drawer-open')).toBeInTheDocument()

    await user.click(screen.getByTestId('drawer-open'))

    expect(await screen.findByTestId('drawer-title')).toBeInTheDocument()
    expect(screen.getByTestId('drawer-title')).toHaveTextContent('Title')
    expect(screen.getByTestId('drawer-description')).toHaveTextContent('Description')
    expect(screen.getByTestId('drawer-close')).toBeInTheDocument()
  })

  it('closes the drawer when the close button is clicked', async () => {
    render(<ControlledDrawer />)

    fireEvent.click(screen.getByTestId('drawer-open'))
    expect(await screen.findByTestId('drawer-close')).toBeInTheDocument()

    fireEvent.click(screen.getByTestId('drawer-close'))

    await waitFor(() => {
      expect(screen.queryByTestId('drawer-close')).not.toBeInTheDocument()
    })

    expect(screen.getByTestId('drawer-open')).toBeInTheDocument()
  })
})