import { Link } from 'react-router-dom';
import { Home, ShoppingBag, ArrowLeft } from 'lucide-react';
import SEO from '../components/SEO';
import './NotFound.css';

/**
 * 404 Not Found Page
 * Modern, animated 404 page with helpful navigation
 */
const NotFound = () => {
    return (
        <>
            <SEO
                title="Page Not Found"
                description="The page you're looking for doesn't exist. Return to Army SMP 2 home page."
                noIndex={true}
            />

            <div className="not-found-page">
                <div className="not-found-content">
                    {/* Animated 404 */}
                    <div className="not-found-animation">
                        <div className="glitch-wrapper">
                            <div className="glitch" data-text="404">404</div>
                        </div>
                    </div>

                    {/* Floating particles */}
                    <div className="particles">
                        {[...Array(6)].map((_, i) => (
                            <div key={i} className={`particle particle-${i + 1}`} />
                        ))}
                    </div>

                    <h1 className="not-found-title">Page Not Found</h1>

                    <p className="not-found-message">
                        Oops! The page you're looking for seems to have wandered off into the void.
                        Don't worry, even the best explorers get lost sometimes.
                    </p>

                    <div className="not-found-actions">
                        <Link to="/" className="btn btn-primary">
                            <Home size={18} />
                            Back to Home
                        </Link>
                        <Link to="/store" className="btn btn-outline">
                            <ShoppingBag size={18} />
                            Visit Store
                        </Link>
                    </div>

                    <button
                        className="go-back-link"
                        onClick={() => window.history.back()}
                    >
                        <ArrowLeft size={16} />
                        Go back to previous page
                    </button>
                </div>

                {/* Background decoration */}
                <div className="not-found-bg">
                    <div className="bg-gradient" />
                    <div className="bg-grid" />
                </div>
            </div>
        </>
    );
};

export default NotFound;
