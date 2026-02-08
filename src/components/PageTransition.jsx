import React, { useEffect, useState } from 'react';
import { useLocation } from 'react-router-dom';
import './PageTransition.css';

const PageTransition = ({ children }) => {
    const location = useLocation();
    const [displayChildren, setDisplayChildren] = useState(children);
    const [transitionState, setTransitionState] = useState('enter');

    useEffect(() => {
        // Start exit animation
        setTransitionState('exit');

        // Scroll to top on route change
        window.scrollTo({ top: 0, behavior: 'instant' });

        // After exit animation, update children and start enter animation
        const exitTimer = setTimeout(() => {
            setDisplayChildren(children);
            setTransitionState('enter');
        }, 200); // Exit animation duration

        return () => clearTimeout(exitTimer);
    }, [location.pathname]); // Trigger on route change

    // Update children reference when they change but not during transition
    useEffect(() => {
        if (transitionState === 'enter') {
            setDisplayChildren(children);
        }
    }, [children, transitionState]);

    return (
        <div className={`page-transition page-transition-${transitionState}`}>
            {displayChildren}
        </div>
    );
};

export default PageTransition;

