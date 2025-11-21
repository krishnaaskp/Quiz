
        let currentQuestion = 0;
        let answers = {};
        let markedForReview = {};
        let submitted = false;
        let totalTime = 120 * 60;
        let testStarted = false;
        let startTime = null;
        let endTime = null;
        
        // Initialize the test
        window.onload = function() {
            // Show welcome screen by default
            showWelcomeScreen();
            
            // Preload test content but don't show it
            generateQuestionsGrid();
            
            // Hide text on small screens for bottom nav buttons
            handleBottomNavResponsive();
            window.addEventListener('resize', handleBottomNavResponsive);
        };
        
        // Handle responsive bottom navigation
        function handleBottomNavResponsive() {
            const navTexts = document.querySelectorAll('.nav-btn-text');
            if (window.innerWidth < 500) {
                navTexts.forEach(el => el.style.display = 'none');
            } else {
                navTexts.forEach(el => el.style.display = 'inline');
            }
        }
        
        // Function to handle beforeunload event
        function beforeUnloadHandler(e) {
            if (testStarted && !submitted) {
                e.preventDefault();
                e.returnValue = 'You have an ongoing test. Are you sure you want to leave?';
                showConfirmationModal();
                return 'You have an ongoing test. Are you sure you want to leave?';
            }
        }
        
        // Prevent page refresh or close during test
        window.addEventListener('beforeunload', beforeUnloadHandler);
        
        // Show welcome screen
        function showWelcomeScreen() {
            document.getElementById('welcome-screen').style.display = 'flex';
            document.getElementById('test-content').style.display = 'none';
            document.getElementById('bottom-nav').style.display = 'none';
            document.getElementById('header-controls').style.display = 'none';
            document.getElementById('header-app-name').textContent = 'MathQuestion.in';
        }
        
        // Show confirmation modal
        function showConfirmationModal() {
            document.getElementById('confirmation-modal').classList.add('show');
        }
        
        // Hide confirmation modal
        function hideConfirmationModal() {
            document.getElementById('confirmation-modal').classList.remove('show');
        }
        
        // Confirm exit
        function confirmExit() {
            window.removeEventListener('beforeunload', beforeUnloadHandler);
            window.location.href = window.location.href;
        }
        
        // Show submit confirmation modal
        function showSubmitConfirmationModal() {
            const attempted = Object.keys(answers).length;
            const remaining = questions.length - attempted;
            const marked = Object.keys(markedForReview).length;
            
            document.getElementById('submit-confirmation-message').innerHTML = `
                You have attempted ${attempted} of ${questions.length} questions.<br>
                ${remaining} questions are unattempted.<br>
                ${marked} questions marked for review.
            `;
            
            document.getElementById('submit-confirmation-modal').classList.add('show');
        }
        
        // Hide submit confirmation modal
        function hideSubmitConfirmationModal() {
            document.getElementById('submit-confirmation-modal').classList.remove('show');
        }
        
        // Start the test
        function startTest() {
            testStarted = true;
            startTime = new Date();
            // Push state to enable back button handling
            history.pushState(null, document.title, window.location.href);
            
            document.getElementById('welcome-screen').style.display = 'none';
            document.getElementById('test-content').style.display = 'block';
            document.getElementById('bottom-nav').style.display = 'flex';
            document.getElementById('header-controls').style.display = 'flex';
            document.getElementById('header-app-name').textContent = 'MathQuestion.in';
            
            initializeTest();
            startTimer();
            updateNextButton();
            updateReviewButton();
        }
        
        // Initialize test data
        function initializeTest() {
            // Show first question
            showQuestion(0);
            updateProgress();
        }

        // Generate questions grid for navigation
        function generateQuestionsGrid() {
            const grid = document.getElementById('questions-grid');
            grid.innerHTML = '';
            
            questions.forEach((q, index) => {
                const box = document.createElement('div');
                box.className = 'q-box';
                box.textContent = index + 1;
                box.onclick = () => {
                    showQuestion(index);
                    hideQuestionsModal();
                };
                box.id = `nav-box-${index}`;
                grid.appendChild(box);
            });
        }
        
        // Show questions navigation modal
        function showQuestionsModal() {
            document.getElementById('questions-modal').classList.add('show');
            updateQuestionsGrid();
        }
        
        // Hide questions navigation modal
        function hideQuestionsModal() {
            document.getElementById('questions-modal').classList.remove('show');
        }
        
        // Update questions grid with current status
        function updateQuestionsGrid() {
            questions.forEach((q, index) => {
                const box = document.getElementById(`nav-box-${index}`);
                if (!box) return;
                
                box.classList.remove('current', 'attempted', 'correct', 'incorrect', 'marked');
                
                if (index === currentQuestion) {
                    box.classList.add('current');
                }
                
                if (submitted) {
                    const userAns = answers[q.id];
                    if (userAns === q.answer) {
                        box.classList.add('correct');
                    } else if (userAns) {
                        box.classList.add('incorrect');
                    }
                } else if (answers[q.id]) {
                    box.classList.add('attempted');
                }
                
                if (markedForReview[q.id]) {
                    box.classList.add('marked');
                }
            });
        }
        
        // Show a specific question
        function showQuestion(index) {
            if (index < 0 || index >= questions.length) return;
            
            currentQuestion = index;
            const question = questions[index];
            
            // Update question counter
            document.getElementById('question-counter').textContent = `Question ${index + 1} of ${questions.length}`;
            
            // Generate question HTML
            let html = `
                <div class="question-card">
                    <div class="question-text">
                        ${formatContent(question.question)}
                    </div>
                    <div class="options" id="options-container">`;
            
            // Add options
            ['option_1', 'option_2', 'option_3', 'option_4'].forEach((optKey, i) => {
                const opt = question[optKey];
                if (!opt) return;
                
                const optionNumber = (i + 1).toString();
                const isCorrectAnswer = optionNumber === question.answer;
                const isUserAnswer = answers[question.id] === optionNumber;
                let optionClass = '';
                let feedbackIcon = '';
                
                // When reviewing, add appropriate classes and feedback icons
                if (submitted) {
                    if (isCorrectAnswer) {
                        optionClass += ' correct-answer';
                        feedbackIcon = `<span class="feedback-icon correct-icon">✓</span>`;
                    } 
                    
                    if (isUserAnswer) {
                        if (isCorrectAnswer) {
                            optionClass += ' correct-answer';
                            feedbackIcon = `<span class="feedback-icon correct-icon">✓</span>`;
                        } else {
                            optionClass += ' incorrect';
                            feedbackIcon = `<span class="feedback-icon incorrect-icon">✗</span>`;
                        }
                    }
                }
                
                html += `
                    <div class="option-item">
                        <input class="option-input" type="radio" name="q${index}" 
                            id="opt-${index}-${optionNumber}" value="${optionNumber}"
                            data-option="${optionNumber}" data-correct="${isCorrectAnswer}"
                            ${isUserAnswer ? 'checked' : ''}
                            ${submitted ? 'disabled' : ''}
                            onclick="toggleAnswer('${question.id}', '${optionNumber}', this)">
                       <label class="option-label${optionClass}" for="opt-${index}-${optionNumber}">
                            <span class="option-number">${optionNumber}</span>
                            ${formatContent(opt)}
                            ${feedbackIcon}
                        </label>
                    </div>`;
            });
            
            // Add solution and marks info
            if (submitted && question.solution_text) {
                const isCorrect = answers[question.id] === question.answer;
                const posMarks = question.positive_marks ? parseFloat(question.positive_marks) : (total_marks / questions.length);
                const negMarks = question.negative_marks ? parseFloat(question.negative_marks) : 0;
                
                const resultText = answers[question.id] ? 
                    (isCorrect ? 
                        `<span style="color: var(--success)">✓ Correct! (+${posMarks.toFixed(2)} marks)</span>` : 
                        `<span style="color: var(--danger)">✗ Incorrect! (-${negMarks.toFixed(2)} marks)</span>`) : 
                    `<span style="color: var(--gray)">Not attempted (0.00 marks)</span>`;
                
                const correctAnswer = `Correct Answer: <strong>${question.answer}</strong>`;
                
                // Add solution video button if available
                let solutionVideoBtn = '';
                if (question.solution_video) {
                    solutionVideoBtn = `
                        <a href="${question.solution_video}" target="_blank" class="solution-video-btn">
                            <i class="fas fa-play"></i> Watch Solution Video
                        </a>`;
                }
                
                html += `
                    <div class="solution-container">
                        <div class="solution-title">${resultText}</div>
                        <div class="correct-answer-indicator">${correctAnswer}</div>
                        <div class="solution-text">
                            ${formatContent(question.solution_text)}
                            ${solutionVideoBtn}
                        </div>
                    </div>`;
            }
            
            html += `</div></div>`;
            
            document.getElementById('questions-container').innerHTML = html;
            
            // Add review mode class if submitted
            if (submitted) {
                document.getElementById('options-container').classList.add('review-mode');
            }
            
            // Update questions grid
            updateQuestionsGrid();
            updateNextButton();
            updateReviewButton();
        }
        
        // Update the next button to show submit on last question
        function updateNextButton() {
            if (!testStarted) return;
            
            const nextBtn = document.getElementById('next-btn');
            if (currentQuestion === questions.length - 1) {
                if (!submitted) {
                    nextBtn.innerHTML = '<i class="fas fa-paper-plane"></i>';
                    nextBtn.onclick = confirmSubmit;
                    nextBtn.classList.remove('nav-btn-outline');
                    nextBtn.classList.add('nav-btn-primary');
                    if (window.innerWidth >= 500) {
                        nextBtn.innerHTML = '<span>Submit</span><i class="fas fa-paper-plane"></i>';
                    }
                } else {
                    nextBtn.style.display = 'none';
                }
            } else {
                nextBtn.style.display = 'flex';
                nextBtn.innerHTML = '<i class="fas fa-chevron-right"></i>';
                nextBtn.onclick = nextQuestion;
                nextBtn.classList.remove('nav-btn-primary');
                nextBtn.classList.add('nav-btn-outline');
                if (window.innerWidth >= 500) {
                    nextBtn.innerHTML = '<span>Next</span><i class="fas fa-chevron-right"></i>';
                }
            }
        }
        
        // Update the review button state
        function updateReviewButton() {
            if (!testStarted || submitted) return;
            
            const reviewBtn = document.getElementById('review-btn');
            const isMarked = markedForReview[questions[currentQuestion].id];
            
            if (isMarked) {
                reviewBtn.innerHTML = '<i class="fas fa-star"></i>';
                reviewBtn.classList.add('active');
                if (window.innerWidth >= 500) {
                    reviewBtn.innerHTML = '<i class="fas fa-star"></i><span>Marked for Review</span>';
                }
            } else {
                reviewBtn.innerHTML = '<i class="far fa-star"></i>';
                reviewBtn.classList.remove('active');
                if (window.innerWidth >= 500) {
                    reviewBtn.innerHTML = '<i class="far fa-star"></i><span>Mark for Review</span>';
                }
            }
        }
        
        function formatContent(text) {
            if (!text) return '';
            // Ensure images don't overflow and preserve other formatting
            return text.replace(/<img/g, '<img style="max-width:100%;height:auto;"');
        }
        
        // Toggle answer selection (allows unselecting by clicking again)
        function toggleAnswer(qId, option, inputElement) {
            if (submitted) return;
            
            // If clicking the already selected option, unselect it
            if (answers[qId] === option) {
                delete answers[qId];
                inputElement.checked = false;
            } else {
                answers[qId] = option;
            }
            
            updateProgress();
            updateQuestionsGrid();
            updateNextButton();
        }
        
        // Toggle review status for current question
        function toggleReview() {
            if (submitted) return;
            
            const qId = questions[currentQuestion].id;
            if (markedForReview[qId]) {
                delete markedForReview[qId];
            } else {
                markedForReview[qId] = true;
            }
            
            updateQuestionsGrid();
            updateReviewButton();
        }
        
        // Navigate to previous/next question
        function prevQuestion() { 
            if (currentQuestion > 0) showQuestion(currentQuestion - 1); 
        }
        
        function nextQuestion() { 
            if (currentQuestion < questions.length - 1) showQuestion(currentQuestion + 1); 
        }
        
        // Update progress
        function updateProgress() {
            const attempted = Object.keys(answers).length;
            // Update any progress indicators if needed
        }
        
        // Start timer
        function startTimer() {
            const timerDisplay = document.getElementById('timer-display');
            let timeLeft = totalTime;
            
            const timerInterval = setInterval(() => {
                if (timeLeft <= 0 || submitted) {
                    clearInterval(timerInterval);
                    if (!submitted) submitTest();
                    return;
                }
                
                const hours = Math.floor(timeLeft / 3600);
                const minutes = Math.floor((timeLeft % 3600) / 60);
                const seconds = timeLeft % 60;
                
                if (hours > 0) {
                    timerDisplay.textContent = `${hours}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
                } else {
                    timerDisplay.textContent = `${minutes}:${seconds.toString().padStart(2, '0')}`;
                }
                
                timeLeft--;
            }, 1000);
        }
        
        // Confirm before submitting
        function confirmSubmit() {
            if (submitted) return;
            showSubmitConfirmationModal();
        }
        
        // Submit test
        function submitTest() {
            if (submitted) return;
            
            submitted = true;
            endTime = new Date();
            hideSubmitConfirmationModal();
            
            let score = 0;
            let positiveMarksTotal = 0;
            let negativeMarksTotal = 0;
            let correctCount = 0;
            let incorrectCount = 0;
            let unattemptedCount = 0;
            let totalMarks = 200;
            let marksPerQuestion = totalMarks / questions.length;
            
            questions.forEach((q, index) => {
                const userAns = answers[q.id];
                const positiveMarks = q.positive_marks ? parseFloat(q.positive_marks) : marksPerQuestion;
                const negativeMarks = q.negative_marks ? parseFloat(q.negative_marks) : 0;
                
                if (!userAns) {
                    unattemptedCount++;
                } else if (userAns === q.answer) {
                    correctCount++;
                    positiveMarksTotal += positiveMarks;
                    score += positiveMarks;
                } else {
                    incorrectCount++;
                    negativeMarksTotal += negativeMarks;
                    score -= negativeMarks;
                }
            });
            
            // Ensure score doesn't go below 0
            score = Math.max(0, Math.round(score * 100) / 100);
            
            // Update positive and negative marks display
            document.getElementById('positive-marks').textContent = positiveMarksTotal.toFixed(2);
            document.getElementById('negative-marks').textContent = negativeMarksTotal.toFixed(2);
            
            // Calculate accuracy
            const accuracy = correctCount / (correctCount + incorrectCount) * 100;
            const accuracyText = isNaN(accuracy) ? '0%' : Math.round(accuracy) + '%';
            
            // Calculate time taken
            const timeTakenMs = endTime - startTime;
            const timeTakenMinutes = Math.floor(timeTakenMs / 60000);
            const timeTakenSeconds = Math.floor((timeTakenMs % 60000) / 1000);
            const avgTimePerQuestion = Math.floor(timeTakenMs / questions.length / 1000);
            
            // Calculate final score (allowing negative)
            score = Math.round((positiveMarksTotal - negativeMarksTotal) * 100) / 100;
            
            // Calculate score percentage for the circle (use absolute score for display)
            const scorePercent = Math.round((Math.max(0, score) / totalMarks) * 100);
            const circleRotation = (scorePercent / 100) * 360;
            
            // Update the score circle
            const circleFill = document.getElementById('score-circle-fill');
            circleFill.style.transform = `rotate(${Math.min(circleRotation, 180)}deg)`;
            
            if (circleRotation > 180) {
                circleFill.style.borderColor = 'var(--primary) var(--primary) transparent transparent';
                
                // Remove any existing second half circle
                const existingSecondHalf = document.getElementById('score-circle-fill-second');
                if (existingSecondHalf) existingSecondHalf.remove();
                
                // Add a second half circle
                const secondHalf = document.createElement('div');
                secondHalf.className = 'score-circle-fill';
                secondHalf.style.borderColor = 'transparent transparent var(--primary) var(--primary)';
                secondHalf.style.transform = `rotate(${circleRotation - 180}deg)`;
                secondHalf.id = 'score-circle-fill-second';
                document.querySelector('.score-circle').appendChild(secondHalf);
            } else {
                circleFill.style.borderColor = 'var(--primary)';
                const existingSecondHalf = document.getElementById('score-circle-fill-second');
                if (existingSecondHalf) existingSecondHalf.remove();
            }
            
            // Update result values
            document.getElementById('score-value').textContent = score;
            document.getElementById('score-percent').textContent = scorePercent + '%';
            document.getElementById('correct-value').textContent = correctCount;
            document.getElementById('incorrect-value').textContent = incorrectCount;
            document.getElementById('unattempted-value').textContent = unattemptedCount;
            document.getElementById('attempted-value').textContent = correctCount + incorrectCount;
            document.getElementById('accuracy-value').textContent = accuracyText;
            document.getElementById('reviewed-value').textContent = Object.keys(markedForReview).length;
            
            // Update detailed stats
            document.getElementById('time-taken').textContent = `${timeTakenMinutes} min ${timeTakenSeconds} sec`;
            document.getElementById('time-per-question').textContent = `${avgTimePerQuestion} sec`;
            
            // Show the results modal
            document.getElementById('results-modal').classList.add('show');
            
            // Disable submit button
            const submitBtn = document.getElementById('submit-btn');
            // submitBtn.disabled = true; // Remove disabling
            submitBtn.innerHTML = '<i class="fas fa-check"></i>';
            submitBtn.style.backgroundColor = 'var(--success)';
            submitBtn.onclick = showResultsModal; // Allow showing results again
            submitBtn.title = 'Show Results';
            
            // Update next button
            updateNextButton();
            
            // Refresh current question view to show solution
            showQuestion(currentQuestion);
        }
        
        // Review test after submission
        function reviewTest() {
            document.getElementById('results-modal').classList.remove('show');
            currentQuestion = 0; // Start from first question
            showQuestion(currentQuestion);
        }
        
        // Add showResultsModal function
        function showResultsModal() {
            document.getElementById('results-modal').classList.add('show');
        }
        
        // Keyboard navigation
        document.addEventListener('keydown', function(e) {
            if (e.key === 'ArrowLeft') prevQuestion();
            if (e.key === 'ArrowRight') nextQuestion();
            if (e.key === 'Escape') hideQuestionsModal();
        });
        
        // Handle clicks on links during test
        document.addEventListener('click', function(e) {
            if (testStarted && !submitted) {
                const target = e.target.closest('a');
                if (target && target.getAttribute('href') && !target.getAttribute('href').startsWith('#')) {
                    e.preventDefault();
                    showConfirmationModal();
                }
            }
        });
        
        // Close modals when clicking outside
        window.addEventListener('click', function(event) {
            if (event.target === document.getElementById('results-modal')) {
                document.getElementById('results-modal').classList.remove('show');
            }
            if (event.target === document.getElementById('questions-modal')) {
                hideQuestionsModal();
            }
            if (event.target === document.getElementById('confirmation-modal')) {
                hideConfirmationModal();
            }
            if (event.target === document.getElementById('submit-confirmation-modal')) {
                hideSubmitConfirmationModal();
            }
        });
        
        // Handle browser back button
        window.addEventListener('popstate', function(e) {
            if (testStarted && !submitted) {
                e.preventDefault();
                showConfirmationModal();
                // Push a new state to prevent immediate navigation
                history.pushState(null, document.title, window.location.href);
            }
        });
    






