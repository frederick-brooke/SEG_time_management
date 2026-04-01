import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { Drawer } from '../Drawer' 

describe('Drawer component', () => {
  test('renders Drawer and opens correctly', async () => {
    const user = userEvent.setup()

    render(
      <Drawer>
        <Button data-testid="drawer-open">Open</Button>
        <div data-testid="drawer-content">
          <h2 data-testid="drawer-title">Title</h2>
          <p data-testid="drawer-description">Description</p>
          <Button data-testid="drawer-close">Close</Button>
        </div>
      </Drawer>
    )

    // Open the drawer
    await user.click(screen.getByTestId('drawer-open'))

    // Check that content is visible
    expect(screen.getByTestId('drawer-content')).toBeInTheDocument()
    expect(screen.getByTestId('drawer-title')).toHaveTextContent('Title')
    expect(screen.getByTestId('drawer-description')).toHaveTextContent('Description')
  })
})