import * as React from 'react';
import { render, screen } from '@testing-library/react';
import { UpcomingExams } from '../upcoming-exams'; // Adjust import path as needed

// Mock Next.js Link component to simply render an anchor tag
jest.mock('next/link', () => {
    return ({ children, href, className }) => (
        <a href={href} className={className}>
            {children}
        </a>
    );
});

describe('UpcomingExams Component', () => {
    // We set a fixed "today" date so tests are always deterministic
    const FIXED_SYSTEM_TIME = '2024-05-10T12:00:00Z';

    beforeAll(() => {
        jest.useFakeTimers();
        jest.setSystemTime(new Date(FIXED_SYSTEM_TIME));
    });

    afterAll(() => {
        jest.useRealTimers();
    });

    const mockExams = [
        {
            id: 'past-exam',
            title: 'History 101',
            examDate: '2024-05-01T10:00:00Z', // 9 days ago
            tasks: [1, 2, 3]
        },
        {
            id: 'far-future-exam',
            title: 'Biology 202',
            examDate: '2024-06-15T10:00:00Z', // > 14 days away
            tasks: [1]
        },
        {
            id: 'upcoming-exam-1',
            title: 'Calculus III',
            examDate: '2024-05-15T10:00:00Z', // 5 days away
            tasks: [1, 2]
        },
        {
            id: 'upcoming-exam-2',
            title: 'Physics II',
            examDate: '2024-05-12T10:00:00Z', // 2 days away
            // Intentionally omitting tasks to test the fallback
        }
    ];

    it('returns null and renders nothing if the exams array is empty', () => {
        const { container } = render(<UpcomingExams exams={[]} />);
        expect(container).toBeEmptyDOMElement();
    });

    it('returns null and renders nothing if no exams fall within the 14-day window', () => {
        // Passing only the past and far-future exams
        const { container } = render(
            <UpcomingExams exams={[mockExams[0], mockExams[1]]} />
        );
        expect(container).toBeEmptyDOMElement();
    });

    it('renders the component and heading when there are valid upcoming exams', () => {
        render(<UpcomingExams exams={mockExams} />);
        expect(screen.getByText('Exams Approaching')).toBeInTheDocument();
    });

    it('filters out past exams and exams beyond 14 days', () => {
        render(<UpcomingExams exams={mockExams} />);
        
        // Should be in the document
        expect(screen.getByText('Calculus III')).toBeInTheDocument();
        expect(screen.getByText('Physics II')).toBeInTheDocument();
        
        // Should NOT be in the document
        expect(screen.queryByText('History 101')).not.toBeInTheDocument();
        expect(screen.queryByText('Biology 202')).not.toBeInTheDocument();
    });

    it('sorts the upcoming exams by closest date first', () => {
        render(<UpcomingExams exams={mockExams} />);
        
        // Find all exam titles rendered as h3 elements
        const renderedTitles = screen.getAllByRole('heading', { level: 3 }).map(el => el.textContent);
        
        // Physics II (May 12) should appear before Calculus III (May 15)
        expect(renderedTitles).toEqual(['Physics II', 'Calculus III']);
    });

    it('displays the correct task count, defaulting to 0 if tasks array is missing', () => {
        render(<UpcomingExams exams={mockExams} />);
        
        // Calculus III has 2 tasks
        expect(screen.getByText('2 Tasks remaining in your study plan')).toBeInTheDocument();
        
        // Physics II has no tasks array provided
        expect(screen.getByText('0 Tasks remaining in your study plan')).toBeInTheDocument();
    });

    it('formats the exam date correctly using en-GB locale', () => {
        render(<UpcomingExams exams={mockExams} />);
        
        // May 12, 2024 in en-GB is 12/05/2024
        expect(screen.getByText('12/05/2024')).toBeInTheDocument();
        
        // May 15, 2024 in en-GB is 15/05/2024
        expect(screen.getByText('15/05/2024')).toBeInTheDocument();
    });

    it('generates the correct href for the Next.js Link', () => {
        render(<UpcomingExams exams={mockExams} />);
        
        const links = screen.getAllByRole('link');
        
        // Physics II is first (sorted)
        expect(links[0]).toHaveAttribute('href', '/exam-planner/upcoming-exam-2');
        // Calculus III is second
        expect(links[1]).toHaveAttribute('href', '/exam-planner/upcoming-exam-1');
    });
});