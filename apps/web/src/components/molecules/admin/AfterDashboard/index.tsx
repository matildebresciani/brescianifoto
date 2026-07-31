import './index.scss';

const AfterDashboard = () => {
    return (
        <div className="after-dashboard">
            <p className="support__link">
                Contact Support:{' '}
                <a href="mailto:support@oak.dk" target="_blank" rel="noreferrer">
                    support@oak.dk
                </a>
                {' | '}
                <a href="tel:+4521191624" target="_blank" rel="noreferrer">
                    +45 21 19 16 24
                </a>
                {' | '}
                <a href="https://www.oak.dk" target="_blank" rel="noreferrer">
                    oak.dk
                </a>
            </p>
        </div>
    );
};

export default AfterDashboard;
