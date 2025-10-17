class DigitalTransformationSimulation {
    constructor() {
        this.config = null;
        this.isConfigLoaded = false;
        
        console.log('🚀 Starting simulation initialization...');
        
        // Load configuration first
        this.loadConfiguration().then(() => {
            console.log('✅ Configuration loaded successfully');
            this.initializeSimulation();
        }).catch(error => {
            console.warn('⚠️ Failed to load custom configuration:', error);
            console.log('📝 Loading default configuration...');
            this.loadDefaultConfiguration();
            this.initializeSimulation();
        });
    }

    async loadConfiguration() {
        try {
            console.log('🔍 Attempting to load simulation-config.json...');
            
            // Add cache-busting parameter
            const timestamp = new Date().getTime();
            const response = await fetch(`simulation-config.json?t=${timestamp}`);
            
            if (!response.ok) {
                throw new Error(`HTTP ${response.status}: ${response.statusText}`);
            }
            
            const configText = await response.text();
            console.log('📄 Raw JSON response:', configText.substring(0, 200) + '...');
            
            this.config = JSON.parse(configText);
            
            // Validate configuration structure
            if (!this.config.company || !this.config.instructorSettings) {
                throw new Error('Invalid configuration structure');
            }
            
            this.isConfigLoaded = true;
            console.log('✅ Configuration loaded and validated:', this.config);
            console.log('🎯 Starting values:', this.config.instructorSettings.startingValues);
            
        } catch (error) {
            console.error('❌ Configuration loading failed:', error);
            throw error;
        }
    }

    loadDefaultConfiguration() {
        console.log('📝 Creating default configuration...');
        this.config = {
            company: {
                name: "TechCorp",
                industry: "Manufacturing",
                investment: "$2M",
                systems: "ERP and CRM systems",
                targetAdoption: 80,
                timeline: 6
            },
            instructorSettings: {
                allowRestart: true,
                allowRedo: true,
                hideImpacts: true,
                continueFlow: 'next-scenario',
                startingValues: {
                    adoption: 0,
                    morale: 100,
                    project: 0
                }
            },
            scenarios: {
                assessment: [
                    {
                        title: "Resistance Assessment",
                        description: "The IT department is showing strong resistance to the new ERP system. They claim it's too complex and will slow down operations. How do you respond?",
                        choices: [
                            { text: "Organize a detailed training session with IT leadership", impact: "Adoption +15, Morale +5, Project +10" },
                            { text: "Implement the system gradually with IT input", impact: "Adoption +10, Morale +10, Project +5" },
                            { text: "Proceed with implementation as planned", impact: "Adoption +5, Morale -10, Project +15" }
                        ]
                    }
                ],
                planning: [
                    {
                        title: "Timeline Pressure",
                        description: "The board wants to accelerate the timeline by 2 months to meet quarterly targets. This would require cutting some training time. What's your decision?",
                        choices: [
                            { text: "Negotiate for additional resources to maintain quality", impact: "Adoption +20, Morale +10, Project +5" },
                            { text: "Accept the timeline but extend training post-launch", impact: "Adoption +10, Morale +5, Project +20" },
                            { text: "Agree to the accelerated timeline", impact: "Adoption +5, Morale -15, Project +25" }
                        ]
                    }
                ],
                communication: [
                    {
                        title: "Communication Crisis",
                        description: "Rumors are spreading that the new system will lead to job cuts. Employee morale is plummeting. How do you address this?",
                        choices: [
                            { text: "Hold an all-hands meeting to address concerns transparently", impact: "Adoption +15, Morale +20, Project +10" },
                            { text: "Send detailed email communications about job security", impact: "Adoption +10, Morale +10, Project +5" },
                            { text: "Focus on technical training and ignore the rumors", impact: "Adoption +5, Morale -20, Project +15" }
                        ]
                    }
                ],
                engagement: [
                    {
                        title: "Key Champion Leaves",
                        description: "Your main change champion from the operations team has resigned. This was a critical supporter who was driving adoption. How do you respond?",
                        choices: [
                            { text: "Quickly identify and train a new champion", impact: "Adoption +10, Morale +5, Project +10" },
                            { text: "Distribute champion responsibilities across multiple people", impact: "Adoption +15, Morale +10, Project +5" },
                            { text: "Continue without a dedicated champion", impact: "Adoption -5, Morale -10, Project +20" }
                        ]
                    }
                ],
                monitoring: [
                    {
                        title: "Performance Metrics",
                        description: "Adoption rates are below target, but the system is working well for those using it. The board is questioning the investment. What's your strategy?",
                        choices: [
                            { text: "Implement additional incentives and recognition programs", impact: "Adoption +25, Morale +15, Project +10" },
                            { text: "Focus on demonstrating ROI to the board", impact: "Adoption +10, Morale +5, Project +20" },
                            { text: "Make system usage mandatory with consequences", impact: "Adoption +20, Morale -20, Project +15" }
                        ]
                    }
                ]
            },
            feedbackMessages: [
                "Excellent decision! The board is impressed with your strategic thinking and leadership approach.",
                "Good choice. This shows thoughtful consideration of all stakeholders involved.",
                "Interesting approach. The board has some concerns but appreciates your initiative.",
                "The board is concerned about this direction. Consider the long-term implications.",
                "This decision has raised some eyebrows. The board expects better results going forward."
            ]
        };
        this.isConfigLoaded = true;
        console.log('📝 Default configuration created');
    }

    initializeSimulation() {
        console.log('🎮 Initializing simulation...');
        
        this.currentPhase = 1;
        this.maxPhases = 5;
        
        // Use configuration starting values
        const startingValues = this.config.instructorSettings.startingValues;
        this.scores = {
            adoption: startingValues.adoption,
            morale: startingValues.morale,
            project: startingValues.project
        };
        
        console.log('🎯 Setting starting values:', this.scores);
        console.log('📊 Config starting values:', startingValues);
        
        this.totalScore = 0;
        this.completedPhases = new Set();
        this.badges = [];
        this.leaderboard = JSON.parse(localStorage.getItem('leaderboard')) || [];
        this.currentDilemma = null;
        this.currentPhaseName = null;
        
        // Update display immediately with configuration values
        this.updateCompanyInfo();
        this.updateInitialDisplay();
        this.initializeEventListeners();
        this.updateDisplay();
        
        console.log('✅ Simulation initialized successfully');
    }

    updateCompanyInfo() {
        console.log('🏢 Updating company information...');
        
        // Update the intro screen with company information
        const companyName = this.config.company.name;
        const industry = this.config.company.industry;
        const investment = this.config.company.investment;
        const systems = this.config.company.systems;
        const target = this.config.company.targetAdoption;
        const timeline = this.config.company.timeline;

        console.log('🏢 Company info:', { companyName, industry, investment, systems, target, timeline });

        const scenarioP = document.querySelector('.scenario p');
        if (scenarioP) {
            scenarioP.innerHTML = 
                `You've been appointed to lead a critical digital transformation project at ${companyName}, a mid-sized ${industry.toLowerCase()} company. The board has invested ${investment} in new ${systems}, but resistance is mounting across departments.`;
        }

        const challengeList = document.querySelector('.challenge-box ul');
        if (challengeList) {
            challengeList.innerHTML = `
                <li>Navigate 5 critical change management phases</li>
                <li>Handle resistance and stakeholder concerns</li>
                <li>Maintain team morale while driving adoption</li>
                <li>Achieve ${target}%+ adoption rate within ${timeline} months</li>
            `;
        }
        
        console.log('✅ Company information updated');
    }

    updateInitialDisplay() {
        console.log('🎯 Updating initial display with custom values...');
        
        // Update the stats preview on the intro screen immediately
        const startingValues = this.config.instructorSettings.startingValues;
        
        // Update the stat values in the intro screen
        const statValues = document.querySelectorAll('.stats-preview .stat-value');
        if (statValues.length >= 3) {
            statValues[0].textContent = `${startingValues.adoption}%`; // Adoption Rate
            statValues[1].textContent = `${startingValues.morale}%`;   // Team Morale
            statValues[2].textContent = `${startingValues.project}%`;  // Project Progress
        }
        
        console.log('✅ Initial display updated with custom values');
    }

    initializeEventListeners() {
        console.log('🎧 Setting up event listeners...');
        
        document.getElementById('start-simulation').addEventListener('click', () => {
            console.log('🚀 Starting simulation...');
            this.showScreen('game-screen');
            this.showPhaseSelection();
        });

        document.querySelectorAll('.phase-card').forEach(card => {
            card.addEventListener('click', (e) => {
                const phase = e.currentTarget.dataset.phase;
                if (!this.completedPhases.has(phase) || this.config.instructorSettings.allowRedo) {
                    this.startPhase(phase);
                }
            });
        });

        document.querySelectorAll('.choice-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const choice = parseInt(e.currentTarget.dataset.choice);
                this.makeChoice(choice);
            });
        });

        document.getElementById('continue-btn').addEventListener('click', () => {
            this.continueToNextPhase();
        });

        document.getElementById('save-score-btn').addEventListener('click', () => {
            this.saveScore();
        });

        document.getElementById('restart-btn').addEventListener('click', () => {
            this.restartSimulation();
        });
        
        console.log('✅ Event listeners set up');
    }

    showScreen(screenId) {
        document.querySelectorAll('.screen').forEach(screen => {
            screen.classList.remove('active');
        });
        document.getElementById(screenId).classList.add('active');
    }

    showPhaseSelection() {
        document.getElementById('phase-selection').style.display = 'block';
        document.getElementById('dilemma-screen').style.display = 'none';
        document.getElementById('feedback-screen').style.display = 'none';
    }

    showDilemmaScreen() {
        document.getElementById('phase-selection').style.display = 'none';
        document.getElementById('dilemma-screen').style.display = 'block';
        document.getElementById('feedback-screen').style.display = 'none';
    }

    showFeedbackScreen() {
        document.getElementById('phase-selection').style.display = 'none';
        document.getElementById('dilemma-screen').style.display = 'none';
        document.getElementById('feedback-screen').style.display = 'block';
    }

    startPhase(phase) {
        console.log(`🎯 Starting phase: ${phase}`);
        
        const dilemmas = this.config.scenarios[phase] || [];
        if (dilemmas.length === 0) {
            alert('No scenarios available for this phase.');
            return;
        }
        
        const randomDilemma = dilemmas[Math.floor(Math.random() * dilemmas.length)];
        
        this.currentPhaseName = phase;
        this.currentDilemma = randomDilemma;
        this.showDilemma(randomDilemma);
    }

    showDilemma(dilemma) {
        document.getElementById('dilemma-title').textContent = dilemma.title;
        document.getElementById('dilemma-description').textContent = dilemma.description;
        
        dilemma.choices.forEach((choice, index) => {
            const choiceBtn = document.querySelector(`[data-choice="${index}"]`);
            choiceBtn.querySelector('.choice-text').textContent = choice.text;
            
            // Hide impacts if instructor setting is enabled
            if (this.config.instructorSettings.hideImpacts) {
                choiceBtn.querySelector('.choice-impact').textContent = '';
                choiceBtn.querySelector('.choice-impact').style.display = 'none';
            } else {
                choiceBtn.querySelector('.choice-impact').textContent = choice.impact;
                choiceBtn.querySelector('.choice-impact').style.display = 'block';
            }
        });

        this.showDilemmaScreen();
    }

    makeChoice(choiceIndex) {
        const choice = this.currentDilemma.choices[choiceIndex];
        
        // Show impact after choice is made
        if (this.config.instructorSettings.hideImpacts) {
            const choiceBtn = document.querySelector(`[data-choice="${choiceIndex}"]`);
            choiceBtn.querySelector('.choice-impact').textContent = choice.impact;
            choiceBtn.querySelector('.choice-impact').style.display = 'block';
        }
        
        this.applyChoiceImpact(choice.impact);
        this.completedPhases.add(this.currentPhaseName);
        
        this.showFeedback(choice);
    }

    applyChoiceImpact(impactString) {
        const impacts = impactString.split(', ');
        impacts.forEach(impact => {
            const [metric, value] = impact.split(' ');
            const change = parseInt(value);
            
            if (metric === 'Adoption') {
                this.scores.adoption = Math.max(0, Math.min(100, this.scores.adoption + change));
            } else if (metric === 'Morale') {
                this.scores.morale = Math.max(0, Math.min(100, this.scores.morale + change));
            } else if (metric === 'Project') {
                this.scores.project = Math.max(0, Math.min(100, this.scores.project + change));
            }
        });
        
        this.calculateTotalScore();
        this.updateDisplay();
    }

    calculateTotalScore() {
        this.totalScore = Math.round(
            (this.scores.adoption * 0.4) + 
            (this.scores.morale * 0.3) + 
            (this.scores.project * 0.3)
        );
    }

    showFeedback(choice) {
        const feedback = this.generateFeedback(choice);
        document.getElementById('feedback-message').textContent = feedback.message;
        
        const impactChanges = document.getElementById('impact-changes');
        impactChanges.innerHTML = '';
        
        feedback.changes.forEach(change => {
            const changeEl = document.createElement('div');
            changeEl.className = `impact-change ${change.positive ? '' : 'negative'}`;
            changeEl.textContent = change.text;
            impactChanges.appendChild(changeEl);
        });
        
        this.showFeedbackScreen();
    }

    generateFeedback(choice) {
        const feedbacks = this.config.feedbackMessages;
        const randomFeedback = feedbacks[Math.floor(Math.random() * feedbacks.length)];
        
        return {
            message: randomFeedback,
            changes: [
                { text: `Adoption: ${this.scores.adoption}%`, positive: this.scores.adoption > 50 },
                { text: `Morale: ${this.scores.morale}%`, positive: this.scores.morale > 50 },
                { text: `Progress: ${this.scores.project}%`, positive: this.scores.project > 50 }
            ]
        };
    }

    continueToNextPhase() {
        if (this.completedPhases.size >= this.maxPhases) {
            this.showResults();
        } else {
            // Check instructor setting for navigation flow
            if (this.config.instructorSettings.continueFlow === 'next-scenario') {
                // Go directly to next scenario
                this.autoAdvanceToNextPhase();
            } else {
                // Return to Select Next Action page
                this.showPhaseSelection();
            }
        }
    }

    autoAdvanceToNextPhase() {
        // Find next uncompleted phase
        const phases = ['assessment', 'planning', 'communication', 'engagement', 'monitoring'];
        let nextPhase = null;
        
        for (const phase of phases) {
            if (!this.completedPhases.has(phase)) {
                nextPhase = phase;
                break;
            }
        }
        
        if (nextPhase) {
            this.startPhase(nextPhase);
        } else {
            this.showResults();
        }
    }

    showResults() {
        this.calculateBadges();
        this.showScreen('results-screen');
        
        document.getElementById('final-adoption').textContent = `${this.scores.adoption}%`;
        document.getElementById('final-morale').textContent = `${this.scores.morale}%`;
        document.getElementById('final-project').textContent = `${this.scores.project}%`;
        document.getElementById('final-total').textContent = this.totalScore;
        
        this.displayBadges();
        this.displayPerformanceReview();
        this.displayLeaderboard();
    }

    calculateBadges() {
        this.badges = [];
        
        if (this.scores.adoption >= 80) {
            this.badges.push("Change Champion");
        }
        if (this.scores.morale >= 80) {
            this.badges.push("Team Builder");
        }
        if (this.scores.project >= 80) {
            this.badges.push("Project Master");
        }
        if (this.totalScore >= 85) {
            this.badges.push("Transformation Leader");
        }
        if (this.completedPhases.size === this.maxPhases) {
            this.badges.push("Completionist");
        }
    }

    displayBadges() {
        const badgesContainer = document.getElementById('badges-container');
        badgesContainer.innerHTML = '';
        
        this.badges.forEach(badge => {
            const badgeEl = document.createElement('div');
            badgeEl.className = 'badge';
            badgeEl.textContent = badge;
            badgesContainer.appendChild(badgeEl);
        });
    }

    displayPerformanceReview() {
        const review = this.generatePerformanceReview();
        document.getElementById('performance-review').innerHTML = `
            <h3>Performance Review</h3>
            <p>${review}</p>
        `;
    }

    generatePerformanceReview() {
        if (this.totalScore >= 90) {
            return "Outstanding performance! You've successfully navigated the digital transformation with exceptional leadership. Your strategic approach and stakeholder management skills are exemplary. The board is highly satisfied with the results.";
        } else if (this.totalScore >= 75) {
            return "Good performance overall. You've managed the transformation reasonably well, though there are areas for improvement. The board acknowledges your efforts and expects continued progress.";
        } else if (this.totalScore >= 60) {
            return "Satisfactory performance with room for improvement. While you've made progress, the board has concerns about the overall success of the transformation. Focus on stakeholder engagement and adoption strategies.";
        } else {
            return "Below expectations. The transformation has faced significant challenges. The board is concerned about the project's success and expects immediate improvements in your approach to change management.";
        }
    }

    displayLeaderboard() {
        const leaderboardList = document.getElementById('leaderboard-list');
        leaderboardList.innerHTML = '';
        
        this.leaderboard.sort((a, b) => b.score - a.score);
        
        this.leaderboard.slice(0, 10).forEach((entry, index) => {
            const item = document.createElement('div');
            item.className = 'leaderboard-item';
            item.innerHTML = `
                <span>${index + 1}. ${entry.name}</span>
                <span>${entry.score}</span>
            `;
            leaderboardList.appendChild(item);
        });
    }

    saveScore() {
        const playerName = document.getElementById('player-name').value.trim();
        if (!playerName) {
            alert('Please enter your name');
            return;
        }
        
        this.leaderboard.push({
            name: playerName,
            score: this.totalScore,
            date: new Date().toLocaleDateString()
        });
        
        localStorage.setItem('leaderboard', JSON.stringify(this.leaderboard));
        this.displayLeaderboard();
        
        document.getElementById('player-name').value = '';
        alert('Score saved successfully!');
    }

    restartSimulation() {
        if (!this.config.instructorSettings.allowRestart) {
            alert('Restart functionality has been disabled by your instructor.');
            return;
        }
        
        this.currentPhase = 1;
        this.scores = { 
            adoption: this.config.instructorSettings.startingValues.adoption, 
            morale: this.config.instructorSettings.startingValues.morale, 
            project: this.config.instructorSettings.startingValues.project 
        };
        this.totalScore = 0;
        this.completedPhases.clear();
        this.badges = [];
        this.currentDilemma = null;
        this.currentPhaseName = null;
        
        this.showScreen('intro-screen');
        this.updateInitialDisplay(); // Update the intro screen values
        this.updateDisplay();
    }

    updateDisplay() {
        // Update progress bars
        document.getElementById('adoption-progress').style.width = `${this.scores.adoption}%`;
        document.getElementById('adoption-text').textContent = `${this.scores.adoption}%`;
        
        document.getElementById('morale-progress').style.width = `${this.scores.morale}%`;
        document.getElementById('morale-text').textContent = `${this.scores.morale}%`;
        
        document.getElementById('project-progress').style.width = `${this.scores.project}%`;
        document.getElementById('project-text').textContent = `${this.scores.project}%`;
        
        // Update score and phase
        document.getElementById('total-score').textContent = this.totalScore;
        document.getElementById('current-phase').textContent = this.completedPhases.size + 1;
        
        // Update phase cards with proper styling
        document.querySelectorAll('.phase-card').forEach(card => {
            const phase = card.dataset.phase;
            if (this.completedPhases.has(phase)) {
                // Completed phases - greyed out
                card.style.opacity = '0.6';
                card.style.cursor = this.config.instructorSettings.allowRedo ? 'pointer' : 'not-allowed';
                card.style.backgroundColor = '#f0f0f0';
                card.style.borderColor = '#ccc';
            } else {
                // Available phases - normal styling
                card.style.opacity = '1';
                card.style.cursor = 'pointer';
                card.style.backgroundColor = '#f8f9ff';
                card.style.borderColor = '#e1e8ff';
            }
        });

        // Hide/show restart button based on instructor setting
        const restartBtn = document.getElementById('restart-btn');
        if (restartBtn) {
            restartBtn.style.display = this.config.instructorSettings.allowRestart ? 'block' : 'none';
        }
    }
}

// Initialize the simulation when the page loads
document.addEventListener('DOMContentLoaded', () => {
    new DigitalTransformationSimulation();
});