/**
 * AI Assistant for Tariq Ahmad's Portfolio
 * Intelligent chat assistant with knowledge about skills, experience, and projects
 */

import { knowledgeBase } from './knowledge-base.js';

class AIAssistant {
    constructor() {
        this.isMinimized = false;
        this.isTyping = false;
        this.messageHistory = [];
        this.lastUserMessage = '';
        this.conversationContext = [];
        this.hasFabBeenClicked = false;
        this.lastTopic = null;
        this.intentHandlers = this.initializeIntentHandlers();
        this.conversationMemory = {
            currentTopic: null,
            mentionedEntities: new Set(),
            userPreferences: {},
            questionHistory: []
        };

        // Initialize knowledge base with portfolio data
        this.knowledgeBase = knowledgeBase;

        // Check if assistant should be disabled on mobile for non-home sections
        this.isDisabled = this.shouldDisableAssistant();
        if (this.isDisabled) {
            return;
        }

        // Initialize the assistant
        this.init();

        // Set up scroll listener for mobile to hide/show assistant based on section
        if (window.matchMedia('(max-width: 767px)').matches) {
            this.setupSectionWatcher();
        }
    }

    shouldDisableAssistant() {
        const isMobileViewport = window.matchMedia('(max-width: 767px)').matches;
        if (!isMobileViewport) {
            return false;
        }

        // Check if we're in the home/header section
        const currentSection = this.getCurrentSection();
        return currentSection !== 'header' && currentSection !== 'home';
    }

    getCurrentSection() {
        // Check URL hash first
        const hash = window.location.hash.replace('#', '');
        if (hash) {
            return hash;
        }

        // If no hash, check which section is currently visible
        const sections = ['header', 'about', 'resume', 'services', 'contact'];
        const scrollPosition = window.scrollY + 100; // Add offset for header

        for (const sectionId of sections) {
            const section = document.getElementById(sectionId);
            if (section) {
                const sectionTop = section.offsetTop;
                const sectionHeight = section.offsetHeight;

                if (scrollPosition >= sectionTop && scrollPosition < sectionTop + sectionHeight) {
                    return sectionId;
                }
            }
        }

        // Default to header if nothing matches
        return 'header';
    }

    setupSectionWatcher() {
        let lastSection = 'header';

        const checkSection = () => {
            const currentSection = this.getCurrentSection();

            // Only update if section actually changed
            if (currentSection !== lastSection) {
                lastSection = currentSection;
                const shouldHide = currentSection !== 'header' && currentSection !== 'home';

                if (this.elements && this.elements.assistant) {
                    if (shouldHide) {
                        this.elements.assistant.style.display = 'none';
                        // Also close the chat if it's open
                        if (!this.isMinimized) {
                            this.closeChat();
                        }
                    } else {
                        this.elements.assistant.style.display = 'block';
                    }
                }
            }
        };

        // Use requestAnimationFrame for smoother performance
        let ticking = false;
        const optimizedCheck = () => {
            if (!ticking) {
                requestAnimationFrame(() => {
                    checkSection();
                    ticking = false;
                });
                ticking = true;
            }
        };

        window.addEventListener('scroll', optimizedCheck, { passive: true });
        window.addEventListener('hashchange', checkSection);

        // Immediate check without delay
        checkSection();
    }

    initializeIntentHandlers() {
        return [
            // Greeting and Introduction
            {
                name: 'greeting',
                patterns: ['hello', 'hi', 'hey', 'greetings', 'good morning', 'good afternoon', 'good evening', 'howdy', 'hola', 'bonjour', 'ciao', 'aloha'],
                handler: (kb, message) => {
                    this.conversationMemory.currentTopic = 'introduction';
                    const timeOfDay = this.getTimeOfDay();
                    const responses = [
                        `Good ${timeOfDay}! I'm Tariq's professional AI assistant. I'm here to provide comprehensive information about his technical expertise, professional experience, and career achievements. How may I assist you today?`,
                        `Hello! Welcome to Tariq Ahmad's professional portfolio. As his AI assistant, I can share detailed insights about his skills in software development, research experience, and notable projects. What would you like to explore?`,
                        `Greetings! I'm delighted to help you learn more about Tariq Ahmad, a skilled Computer Engineer with expertise in full-stack development and research. What specific aspect of his background interests you?`,
                        `Hi there! I'm Tariq's intelligent assistant, ready to answer any questions you have about his professional background, technical skills, and career journey. What would you like to know?`
                    ];
                    return this.getRandomResponse(responses);
                }
            },

            // Skills and Technical Expertise
            {
                name: 'skills',
                patterns: ['skill', 'technology', 'technologies', 'programming', 'language', 'framework', 'tool', 'tech stack', 'expertise', 'competence', 'proficient', 'specialize', 'work with', 'do you use', 'what do you', 'tech', 'technical', 'coding', 'development', 'software'],
                handler: (kb, message) => {
                    this.conversationMemory.currentTopic = 'skills';
                    const specificTech = this.extractTechnology(message);
                    if (specificTech !== 'technology') {
                        return this.handleSpecificTechnology(kb, specificTech);
                    }

                    return `Tariq has extensive technical expertise across multiple areas:

**Programming Languages:** ${kb.skills.languages.join(', ')}

**Frameworks & Libraries:** ${kb.skills.frameworks.join(', ')}

**Databases:** ${kb.skills.databases.join(', ')}

**Tools & Technologies:** ${kb.skills.tools.join(', ')}

**Networking:** ${kb.skills.networking.join(', ')}

**Operating Systems:** ${kb.skills.os.join(', ')}

He's particularly strong in full-stack development with Python/Django and Java/Spring Boot! Feel free to ask about his experience with a specific technology.`;
                }
            },

            // Work Experience
            {
                name: 'experience',
                patterns: ['experience', 'work', 'job', 'career', 'employment', 'intern', 'position', 'role', 'worked', 'employed', 'professional background'],
                handler: (kb, message) => {
                    this.conversationMemory.currentTopic = 'experience';
                    const specificCompany = this.extractCompany(message);
                    const specificRole = this.extractRole(message);

                    if (specificCompany || specificRole) {
                        return this.handleSpecificExperience(kb, specificCompany, specificRole);
                    }

                    let response = "Here's a summary of Tariq's professional experience:\n\n";
                    kb.experience.forEach((exp) => {
                        response += `**${exp.title}** at ${exp.company}\n`;
                        response += `${exp.duration}\n`;
                        if (exp.location) response += `📍 ${exp.location}\n`;
                        response += `• ${exp.responsibilities.slice(0, 3).join('\n• ')}\n\n`;
                    });
                    response += "He has a strong background in research, software development, and technical analysis. Would you like to know more about a specific role or company?";
                    return response;
                }
            },

            // Projects and Portfolio
            {
                name: 'projects',
                patterns: ['project', 'portfolio', 'work', 'build', 'develop', 'create', 'application', 'app', 'made', 'built', 'created', 'developed'],
                handler: (kb, message) => {
                    this.conversationMemory.currentTopic = 'projects';
                    const specificProject = this.extractProject(message);
                    const techFilter = this.extractTechnology(message);

                    if (specificProject) {
                        return this.handleSpecificProject(kb, specificProject);
                    }

                    if (techFilter !== 'technology') {
                        return this.handleProjectsByTechnology(kb, techFilter);
                    }

                    let response = "Tariq has worked on several impressive projects:\n\n";
                    const topProjects = kb.projects.slice(0, 3);
                    topProjects.forEach((project) => {
                        response += `**${project.name}**\n`;
                        response += `*Technologies: ${project.technologies.join(', ')}*\n`;
                        response += `${project.description}\n\n`;
                    });
                    response += `He has ${kb.stats.projects} total projects. You can ask for more details about a specific one!`;
                    return response;
                }
            },

            // Education and Academic Background
            {
                name: 'education',
                patterns: ['education', 'university', 'degree', 'study', 'school', 'academic', 'qualification', 'college', 'graduation', 'cgpa', 'gpa'],
                handler: (kb, message) => {
                    this.conversationMemory.currentTopic = 'education';
                    let response = `**Education Background:**

🎓 **${kb.personal.degree}** in Computer Engineering
📚 ${kb.personal.university}
📅 ${kb.personal.graduationYear}
🏆 CGPA: ${kb.personal.cgpa}

**Recent Certifications:**\n`;
                    kb.certifications.slice(0, 4).forEach(cert => {
                        response += `• ${cert.name} - ${cert.issuer} (${cert.date})\n`;
                    });
                    response += `\n**Achievements:**\n`;
                    kb.achievements.forEach(achievement => {
                        response += `🏆 ${achievement.name} - ${achievement.issuer} (${achievement.date})\n`;
                    });
                    return response;
                }
            },
            {
                name: 'contact',
                patterns: ['contact', 'reach', 'email', 'phone', 'hire', 'get in touch'],
                handler: (kb) => {
                    return `You can contact Tariq through:

📧 **Email:** ${kb.personal.email}
📱 **Phone:** ${kb.personal.phone}
📍 **Location:** ${kb.personal.location}
💼 **LinkedIn:** [Connect with Tariq](${kb.personal.linkedin})
💻 **GitHub:** [View Code](${kb.personal.github})

**Freelance Status:** ${kb.personal.freelance} ✅

He's actively seeking new opportunities and open to discussing projects!`;
                }
            },
            {
                name: 'about',
                patterns: ['about', 'who', 'person', 'background', 'tell me', 'introduce'],
                handler: (kb) => {
                    return `Let me tell you about Tariq Ahmad:

👨‍💻 **Computer Engineer** from ${kb.personal.location}
🎓 Graduate from ${kb.personal.university}
🏢 Currently working as a **Researcher Intern** at Industrial 4.0 Research Center

**Professional Focus:**
• Full-stack development (Python, Java, JavaScript)
• Research in Industrial 4.0 technologies
• System design and database management
• Machine Learning and AI applications

**Personal Interests:** ${kb.personalInterests.join(', ')}

**Key Stats:**
• ${kb.stats.happyClients}+ Happy Clients
• ${kb.stats.projects} Projects Completed  
• ${kb.stats.hoursOfSupport}+ Hours of Support
• ${kb.stats.awards} Awards

He's passionate about technology and always eager to take on new challenges!`;
                }
            },
            {
                name: 'availability',
                patterns: ['available', 'freelance', 'work together', 'collaboration', 'opportunity'],
                handler: (kb) => {
                    return `Great news! Tariq is currently available for new opportunities:

✅ **Freelance Status:** Available
🎯 **Looking for:** Full-time positions, freelance projects, and collaborations
💼 **Specialties:** 
• Full-stack web development
• Mobile app development  
• AI/ML applications
• System design and architecture

**Best ways to reach him:**
📧 ${kb.personal.email}
💼 [LinkedIn](${kb.personal.linkedin})
📱 ${kb.personal.phone}

He's particularly interested in innovative projects and opportunities to apply his research background in practical applications!`;
                }
            },
            {
                name: 'philosophy',
                patterns: ['philosophy', 'work style', 'approach', 'how do you work'],
                handler: (kb) => {
                    this.lastTopic = { type: 'philosophy' };
                    let response = "Here are a few principles that guide Tariq's work:\n\n";
                    kb.workPhilosophy.forEach(item => {
                        response += `• ${item}\n`;
                    });
                    response += "\nHe's passionate about creating high-quality, user-focused solutions.";
                    return response;
                }
            },
            {
                name: 'project_details',
                patterns: ['more details', 'tell me more about', 'specifics'],
                handler: (kb, message) => {
                    if (this.lastTopic && this.lastTopic.type === 'projects') {
                        // Check if the user is asking about a specific project mentioned in the message
                        const mentionedProject = kb.projects.find(p => message.toLowerCase().includes(p.name.toLowerCase()));

                        if (mentionedProject) {
                            this.lastTopic.data = mentionedProject; // Focus on this project for the next follow-up
                            let response = `Here are more details on **${mentionedProject.name}**:\n\n`;
                            mentionedProject.details.forEach(detail => {
                                response += `• ${detail}\n`;
                            });
                            if (mentionedProject.liveDemo) response += `\n🌐 [Live Demo](${mentionedProject.liveDemo})`;
                            if (mentionedProject.github) response += `\n📚 [GitHub](${mentionedProject.github})`;
                            return response;
                        }

                        // If no specific project is mentioned, ask for clarification
                        return "Of course. Which project are you interested in?";
                    }
                    return "I can provide more details if you first ask me about his projects.";
                }
            },

            // Question Types (Who, What, Where, When, How, Why)
            {
                name: 'who_questions',
                patterns: ['who is', 'who are', 'who was', 'who were', 'who does', 'who do', 'who has', 'who have'],
                handler: (kb, message) => {
                    this.conversationMemory.questionHistory.push({ type: 'who', message });
                    return this.handleWhoQuestion(kb, message);
                }
            },

            {
                name: 'what_questions',
                patterns: ['what is', 'what are', 'what was', 'what were', 'what does', 'what do', 'what has', 'what have', 'what can', 'what should'],
                handler: (kb, message) => {
                    this.conversationMemory.questionHistory.push({ type: 'what', message });
                    return this.handleWhatQuestion(kb, message);
                }
            },

            {
                name: 'where_questions',
                patterns: ['where is', 'where are', 'where was', 'where were', 'where does', 'where do', 'where from', 'location'],
                handler: (kb, message) => {
                    this.conversationMemory.questionHistory.push({ type: 'where', message });
                    return this.handleWhereQuestion(kb, message);
                }
            },

            {
                name: 'when_questions',
                patterns: ['when is', 'when are', 'when was', 'when were', 'when does', 'when do', 'when did', 'when will', 'since when', 'how long'],
                handler: (kb, message) => {
                    this.conversationMemory.questionHistory.push({ type: 'when', message });
                    return this.handleWhenQuestion(kb, message);
                }
            },

            {
                name: 'how_questions',
                patterns: ['how is', 'how are', 'how was', 'how were', 'how does', 'how do', 'how did', 'how will', 'how can', 'how to', 'how much', 'how many'],
                handler: (kb, message) => {
                    this.conversationMemory.questionHistory.push({ type: 'how', message });
                    return this.handleHowQuestion(kb, message);
                }
            },

            {
                name: 'why_questions',
                patterns: ['why is', 'why are', 'why was', 'why were', 'why does', 'why do', 'why did', 'why will'],
                handler: (kb, message) => {
                    this.conversationMemory.questionHistory.push({ type: 'why', message });
                    return this.handleWhyQuestion(kb, message);
                }
            },

            // Contextual Follow-ups
            {
                name: 'follow_up',
                patterns: ['more', 'details', 'tell me more', 'explain', 'elaborate', 'expand', 'additional', 'further'],
                handler: (kb, message) => {
                    return this.handleFollowUp(kb, message);
                }
            },

            // Comparison and Preferences
            {
                name: 'comparison',
                patterns: ['vs', 'versus', 'compare', 'comparison', 'better', 'best', 'prefer', 'favorite', 'strength', 'weakness'],
                handler: (kb, message) => {
                    return this.handleComparison(kb, message);
                }
            },

            // Testimonials and Recommendations
            {
                name: 'testimonials',
                patterns: ['testimonial', 'recommendation', 'review', 'feedback', 'said about', 'think of', 'opinion'],
                handler: (kb, message) => {
                    this.conversationMemory.currentTopic = 'testimonials';
                    let response = "Here's what people have said about working with Tariq:\n\n";
                    kb.testimonials.forEach(testimonial => {
                        response += `**${testimonial.author}** - ${testimonial.position}\n`;
                        response += `"${testimonial.text}"\n\n`;
                    });
                    response += "These testimonials reflect his dedication to quality work and collaborative approach.";
                    return response;
                }
            },

            // Certifications and Achievements
            {
                name: 'certifications',
                patterns: ['certification', 'certificate', 'achievement', 'award', 'recognition', 'accomplishment', 'qualification'],
                handler: (kb, message) => {
                    this.conversationMemory.currentTopic = 'certifications';
                    let response = "Tariq has earned several professional certifications:\n\n";
                    kb.certifications.forEach(cert => {
                        response += `🏆 **${cert.name}**\n`;
                        response += `📚 ${cert.issuer}\n`;
                        response += `📅 ${cert.date}\n\n`;
                    });
                    response += "His certifications demonstrate his commitment to continuous learning and staying current with industry trends.";
                    return response;
                }
            },

            // Social Media and Online Presence
            {
                name: 'social_media',
                patterns: ['social', 'linkedin', 'github', 'twitter', 'facebook', 'instagram', 'online', 'profile', 'portfolio'],
                handler: (kb, message) => {
                    this.conversationMemory.currentTopic = 'social';
                    return `Tariq maintains an active online presence:

🔗 **LinkedIn:** [Professional Network](${kb.personal.linkedin})
💻 **GitHub:** [Code Portfolio](${kb.personal.github})
🐦 **Twitter:** [Tech Updates](${kb.personal.twitter})
📘 **Facebook:** [Personal Profile](${kb.personal.facebook})
📷 **Instagram:** [Tech & Lifestyle](${kb.personal.instagram})

You can find his latest projects, thoughts on technology, and professional updates across these platforms!`;
                }
            },

            // Age and Personal Information
            {
                name: 'age_personal',
                patterns: ['age', 'old', 'born', 'birthday', 'birth', 'young', 'years old'],
                handler: (kb, message) => {
                    const birthYear = 2000; // From birthday info
                    const currentYear = new Date().getFullYear();
                    const age = currentYear - birthYear;

                    return `Tariq was born on ${kb.personal.birthday}, making him ${age} years old. He's a young and dynamic Computer Engineer with a passion for technology and innovation. His fresh perspective combined with his academic background makes him particularly adept at modern development practices and emerging technologies.`;
                }
            },

            // Hobbies and Interests
            {
                name: 'interests',
                patterns: ['hobby', 'interest', 'like', 'enjoy', 'passion', 'free time', 'outside work'],
                handler: (kb, message) => {
                    this.conversationMemory.currentTopic = 'interests';
                    return `Beyond his professional work, Tariq enjoys:

🎮 **${kb.personalInterests.join(', ')}**

These interests help him maintain a balanced lifestyle and bring creativity to his technical work. His passion for soccer reflects his teamwork skills, while reading keeps him intellectually engaged with new ideas and perspectives.`;
                }
            },

            // Future Plans and Goals
            {
                name: 'future_plans',
                patterns: ['future', 'plan', 'goal', 'aspire', 'want to', 'looking forward', 'next', 'career goal'],
                handler: (kb, message) => {
                    return `Tariq has ambitious plans for his future in technology:

🚀 **Short-term Goals:**
• Deepen expertise in AI/ML applications
• Lead complex software projects
• Build innovative solutions for industrial challenges

🎯 **Long-term Vision:**
• Become a technology leader in Industry 4.0
• Contribute to open-source projects
• Mentor aspiring developers
• Start his own tech venture

He's continuously learning and adapting to stay at the forefront of technological advancements!`;
                }
            },

            // Intelligent Fallback - tries to understand and respond helpfully
            {
                name: 'intelligent_fallback',
                patterns: ['.*'], // Matches everything
                handler: (kb, message) => {
                    return this.handleIntelligentFallback(kb, message);
                },
                priority: 0 // Lowest priority, only if nothing else matches
            }
        ];
    }

    /**
     * Initialize the assistant UI and event listeners
     */
    init() {
        this.createAssistantUI();
        this.attachEventListeners();
        this.showWelcomeMessage();

        // Respect user interaction on mobile devices
        if (window.innerWidth < 768) {
            this.minimizeChat();
            this.elements.chatWidget.style.display = 'none';
            this.elements.chatFab.style.display = 'flex';
            this.isMinimized = true;
            return;
        }

        // Auto-show notification badge after a delay if FAB hasn't been clicked
        setTimeout(() => {
            if (!this.hasFabBeenClicked) {
                this.showNotification();
            }
        }, 5000);
    }

    /**
     * Create the assistant UI elements
     */
    createAssistantUI() {
        const assistantHTML = `
      <div class="ai-assistant" id="aiAssistant">
        <!-- Floating Action Button -->
        <button class="chat-fab" id="chatFab">
          <i class="ri-robot-line"></i>
          <div class="notification-badge" id="notificationBadge" style="display: none;">1</div>
        </button>
        
        <!-- Main Chat Widget -->
        <div class="chat-widget" id="chatWidget">
          <!-- Header -->
          <div class="chat-header" id="chatHeader">
            <div class="assistant-info">
              <div class="assistant-avatar">
                <i class="ri-robot-line"></i>
              </div>
              <div class="assistant-details">
                <h4>Professional Assistant</h4>
                <span><div class="status-dot"></div>Available 24/7</span>
              </div>
            </div>
            <div class="chat-controls">
              <button class="control-btn" id="minimizeBtn" title="Minimize">
                <i class="ri-subtract-line"></i>
              </button>
              <button class="control-btn" id="restartBtn" title="Restart Chat">
                <i class="ri-refresh-line"></i>
              </button>
            </div>
          </div>
          
          <!-- Messages Area -->
          <div class="chat-messages" id="chatMessages">
            <div class="welcome-message">
              <i class="ri-robot-line ai-icon"></i>
              <h3>Professional AI Assistant</h3>
              <p>Hello! I'm here to provide detailed insights about Tariq Ahmad's professional background, technical expertise, and career achievements. Feel free to ask me anything about his skills, projects, or experience.</p>
            </div>
          </div>
          
          <!-- Quick Actions -->
          <div class="quick-actions" id="quickActions">
            <div class="quick-actions-title">Quick questions:</div>
            <div class="quick-actions-list">
              <button class="quick-action" data-message="What are your main skills?">Skills</button>
              <button class="quick-action" data-message="Tell me about your experience">Experience</button>
              <button class="quick-action" data-message="What projects have you worked on?">Projects</button>
              <button class="quick-action" data-message="What is your educational background?">Education</button>
              <button class="quick-action" data-message="How can I contact you?">Contact</button>
            </div>
          </div>
          
          <!-- Typing Indicator -->
          <div class="typing-indicator" id="typingIndicator">
            <div class="assistant-info">
              <div class="assistant-avatar">
                <i class="ri-robot-line"></i>
              </div>
              <div class="typing-dots">
                <div class="typing-dot"></div>
                <div class="typing-dot"></div>
                <div class="typing-dot"></div>
              </div>
            </div>
          </div>
          
          <!-- Input Area -->
          <div class="chat-input">
            <div class="input-container">
              <input type="text" class="message-input" id="messageInput" 
                     placeholder="Ask me anything about Tariq..." maxlength="500">
              <button class="send-btn" id="sendBtn">
                <i class="ri-send-plane-fill"></i>
              </button>
            </div>
          </div>
        </div>
      </div>
    `;

        // Insert the assistant into the page
        document.body.insertAdjacentHTML('beforeend', assistantHTML);

        // Get references to elements
        this.elements = {
            assistant: document.getElementById('aiAssistant'),
            chatWidget: document.getElementById('chatWidget'),
            chatFab: document.getElementById('chatFab'),
            chatHeader: document.getElementById('chatHeader'),
            chatMessages: document.getElementById('chatMessages'),
            messageInput: document.getElementById('messageInput'),
            sendBtn: document.getElementById('sendBtn'),
            minimizeBtn: document.getElementById('minimizeBtn'),
            restartBtn: document.getElementById('restartBtn'),
            typingIndicator: document.getElementById('typingIndicator'),
            quickActions: document.getElementById('quickActions'),
            notificationBadge: document.getElementById('notificationBadge')
        };
    }

    /**
     * Attach event listeners to UI elements
     */
    attachEventListeners() {
        // FAB click to show chat
        this.elements.chatFab.addEventListener('click', () => {
            this.hasFabBeenClicked = true;
            this.showChat();
            this.hideNotification();
        });

        // Header click to toggle minimize
        this.elements.chatHeader.addEventListener('click', (e) => {
            if (!e.target.closest('.chat-controls')) {
                this.toggleMinimize();
            }
        });

        // Control buttons
        this.elements.minimizeBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            this.toggleMinimize();
        });

        this.elements.restartBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            this.restartChat();
        });

        // Send message
        this.elements.sendBtn.addEventListener('click', () => this.sendMessage());

        // Enter key to send message
        this.elements.messageInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                this.sendMessage();
            }
        });

        // Input validation
        this.elements.messageInput.addEventListener('input', () => {
            const message = this.elements.messageInput.value.trim();
            this.elements.sendBtn.disabled = message.length === 0;
        });

        // Quick actions
        this.elements.quickActions.addEventListener('click', (e) => {
            if (e.target.classList.contains('quick-action')) {
                const message = e.target.getAttribute('data-message');
                this.elements.messageInput.value = message;
                this.sendMessage();
            }
        });

        // Auto-resize input
        this.elements.messageInput.addEventListener('input', this.autoResizeInput.bind(this));

        // Input focus event (no badge logic needed here anymore)
    }

    /**
     * Show the chat widget
     */
    showChat() {
        // Mark that FAB has been clicked and hide notification
        this.hasFabBeenClicked = true;
        this.hideNotification();

        this.elements.chatFab.style.display = 'none'; // Hide FAB when chat is shown
        this.elements.chatWidget.style.display = 'flex';

        // Small delay to ensure display is set before animation
        setTimeout(() => {
            this.elements.chatWidget.classList.remove('minimized');
            this.isMinimized = false;

            // Focus input after animation completes
            setTimeout(() => {
                this.focusInput();
            }, 600); // Match transition duration
        }, 50);
    }

    /**
     * Hide the chat widget completely
     */
    hideChat() {
        this.elements.chatWidget.classList.add('minimized');
        this.isMinimized = true;
        setTimeout(() => {
            this.elements.chatWidget.style.display = 'none';
            this.elements.chatFab.style.display = 'flex'; // Show FAB when chat is hidden
        }, 600); // Match transition duration
    }

    /**
     * Toggle minimize state
     */
    toggleMinimize() {
        if (this.isMinimized) {
            this.showChat();
        } else {
            this.minimizeChat();
        }
    }

    /**
     * Minimize the chat widget smoothly
     */
    minimizeChat() {
        this.isMinimized = true;
        this.elements.chatWidget.classList.add('minimized');

        // Wait for animation to complete before showing FAB
        setTimeout(() => {
            this.elements.chatWidget.style.display = 'none';
            this.elements.chatFab.style.display = 'flex'; // Show FAB when minimized
        }, 600); // Match transition duration
    }

    /**
     * Close the chat widget completely with smooth animation
     */
    closeChat() {
        this.elements.chatWidget.classList.add('closing');

        setTimeout(() => {
            this.elements.chatWidget.style.display = 'none';
            this.elements.chatWidget.classList.remove('closing');
            this.elements.chatFab.style.display = 'flex'; // Show FAB when closed
            this.isMinimized = true;
        }, 400);
    }

    /**
     * Restart the chat conversation
     */
    restartChat() {
        // Reset conversation state
        this.messageHistory = [];
        this.lastUserMessage = '';
        this.conversationContext = [];
        this.isTyping = false;
        this.lastTopic = null;

        // Clear input field
        this.elements.messageInput.value = '';
        this.elements.sendBtn.disabled = true;
        this.autoResizeInput();

        // Clear messages and restore welcome message
        this.elements.chatMessages.innerHTML = `
            <div class="welcome-message">
                <i class="ri-robot-line ai-icon"></i>
                <h3>Professional AI Assistant</h3>
                <p>Hello! I'm here to provide detailed insights about Tariq Ahmad's professional background, technical expertise, and career achievements. Feel free to ask me anything about his skills, projects, or experience.</p>
            </div>
        `;

        // Show quick actions again
        this.elements.quickActions.style.display = 'block';

        // Hide typing indicator if it's showing
        this.elements.typingIndicator.classList.remove('active');

        // Scroll to top
        this.scrollToBottom();

        // Focus input
        this.focusInput();
    }

    /**
     * Focus the input field
     */
    focusInput() {
        setTimeout(() => {
            const input = this.elements.messageInput;
            if (!input) return;

            try {
                input.focus({ preventScroll: true });
            } catch (error) {
                input.focus();
            }

            if (window.innerWidth < 768) {
                requestAnimationFrame(() => {
                    input.scrollIntoView({ behavior: 'smooth', block: 'center' });
                });
            }
        }, 150);
    }

    /**
     * Auto-resize input field
     */
    autoResizeInput() {
        const input = this.elements.messageInput;
        input.style.height = 'auto';
        const scrollHeight = input.scrollHeight;
        const maxHeight = 80; // Match CSS max-height
        input.style.height = Math.min(scrollHeight, maxHeight) + 'px';

        // Enable/disable scrolling based on content height
        input.style.overflowY = scrollHeight > maxHeight ? 'auto' : 'hidden';
    }

    /**
     * Send a message
     */
    async sendMessage() {
        const message = this.elements.messageInput.value.trim();
        if (!message || this.isTyping) return;

        // Clear input and disable send button
        this.elements.messageInput.value = '';
        this.elements.sendBtn.disabled = true;
        this.autoResizeInput();

        // Hide quick actions after first message
        if (this.messageHistory.length === 0) {
            this.elements.quickActions.style.display = 'none';
        }

        // Add user message
        this.addMessage('user', message);
        this.lastUserMessage = message;

        // Show typing indicator and generate response
        this.showTypingIndicator();

        try {
            const response = await this.generateResponse(message);
            this.hideTypingIndicator();
            await this.streamResponse(response);
        } catch (error) {
            this.hideTypingIndicator();
            this.addMessage('assistant', "I'm sorry, I encountered an error. Please try asking your question again.");
            console.error('Assistant error:', error);
        }

        // Re-enable send button
        this.elements.sendBtn.disabled = false;
    }

    /**
     * Add a message to the chat
     */
    addMessage(sender, content) {
        const time = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
        const avatar = sender === 'assistant' ? '<i class="ri-robot-line"></i>' : '<i class="ri-user-line"></i>';

        // Process content based on sender type
        const processedContent = sender === 'assistant' ? this.parseMarkdown(content) : this.escapeHtml(content);

        const messageHTML = `
      <div class="message ${sender}">
        <div class="message-avatar">${avatar}</div>
        <div class="message-content">${processedContent}</div>
      </div>
      <div class="message-time">${time}</div>
    `;

        // Remove welcome message if it exists
        const welcomeMessage = this.elements.chatMessages.querySelector('.welcome-message');
        if (welcomeMessage) {
            welcomeMessage.remove();
        }

        this.elements.chatMessages.insertAdjacentHTML('beforeend', messageHTML);
        this.scrollToBottom();

        // Store in history
        this.messageHistory.push({ sender, content, time });
    }

    /**
     * Streams the response to the chat, simulating a typing effect.
     * @param {string} text - The full response text to be streamed.
     */
    async streamResponse(text) {
        const time = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
        const avatar = '<i class="ri-robot-line"></i>';

        // Create a message element but with empty content
        const messageId = `msg-${Date.now()}`;
        const messageHTML = `
            <div class="message assistant" id="${messageId}">
                <div class="message-avatar">${avatar}</div>
                <div class="message-content"></div>
            </div>
            <div class="message-time">${time}</div>
        `;

        const welcomeMessage = this.elements.chatMessages.querySelector('.welcome-message');
        if (welcomeMessage) {
            welcomeMessage.remove();
        }

        this.elements.chatMessages.insertAdjacentHTML('beforeend', messageHTML);
        this.scrollToBottom();

        const messageContentElement = document.querySelector(`#${messageId} .message-content`);

        // Split text into words to make the streaming feel more natural
        const words = text.split(' ');
        let currentContent = '';

        for (let i = 0; i < words.length; i++) {
            currentContent += words[i] + ' ';
            messageContentElement.innerHTML = this.parseMarkdown(currentContent);

            // Scroll to bottom as content is added
            this.scrollToBottom();

            // Vary the delay to simulate a more human-like typing speed
            const delay = Math.random() * 50 + 20; // delay between 20ms and 70ms
            await new Promise(resolve => setTimeout(resolve, delay));
        }

        // Final parse to ensure everything is correct
        messageContentElement.innerHTML = this.parseMarkdown(text);
        this.scrollToBottom();

        this.messageHistory.push({ sender: 'assistant', content: text, time });
    }

    /**
     * Parse markdown content to HTML
     */
    parseMarkdown(content) {
        let html = content;

        // Parse bold text **text**
        html = html.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');

        // Parse italic text *text*
        html = html.replace(/\*(.*?)\*/g, '<em>$1</em>');

        // Parse inline code `code`
        html = html.replace(/`(.*?)`/g, '<code>$1</code>');

        // Parse links [text](url)
        html = html.replace(/\[([^\]]*)\]\(([^)]*)\)/g, '<a href="$2" target="_blank" rel="noopener noreferrer">$1</a>');

        // Parse line breaks
        html = html.replace(/\n\n/g, '</p><p>');
        html = html.replace(/\n/g, '<br>');

        // Parse bullet points • or -
        html = html.replace(/^[•\-]\s(.*)$/gm, '<li>$1</li>');

        // Wrap list items in ul
        html = html.replace(/(<li>.*<\/li>)/s, '<ul>$1</ul>');

        // Parse numbered lists
        html = html.replace(/^\d+\.\s(.*)$/gm, '<li>$1</li>');

        // Parse headers (simple approach for **Header:** patterns)
        html = html.replace(/^(\*\*.*?\*\*):?\s*$/gm, '<h4>$1</h4>');

        // Wrap paragraphs
        if (!html.includes('<p>') && !html.includes('<ul>') && !html.includes('<h4>')) {
            html = `<p>${html}</p>`;
        } else if (html.includes('</p><p>')) {
            html = `<p>${html}</p>`;
        }

        // Clean up empty paragraphs and fix formatting
        html = html.replace(/<p><\/p>/g, '');
        html = html.replace(/<p>(<h4>.*?<\/h4>)<\/p>/g, '$1');
        html = html.replace(/<p>(<ul>.*?<\/ul>)<\/p>/g, '$1');

        return html;
    }

    /**
     * Escape HTML characters for user input
     */
    escapeHtml(text) {
        const map = {
            '&': '&amp;',
            '<': '&lt;',
            '>': '&gt;',
            '"': '&quot;',
            "'": '&#039;'
        };
        return text.replace(/[&<>"']/g, m => map[m]);
    }

    /**
     * Show typing indicator
     */
    showTypingIndicator() {
        this.isTyping = true;
        this.elements.typingIndicator.classList.add('active');
        this.scrollToBottom();
    }

    /**
     * Hide typing indicator
     */
    hideTypingIndicator() {
        this.isTyping = false;
        this.elements.typingIndicator.classList.remove('active');
    }

    /**
     * Scroll chat to bottom
     */
    scrollToBottom() {
        setTimeout(() => {
            this.elements.chatMessages.scrollTop = this.elements.chatMessages.scrollHeight;
        }, 100);
    }

    /**
     * Show welcome message
     */
    showWelcomeMessage() {
        // Welcome message is already in HTML
    }

    /**
     * Show notification badge
     */
    showNotification() {
        if (!this.hasFabBeenClicked) {
            this.elements.notificationBadge.style.display = 'flex';
        }
    }

    /**
     * Hide notification badge
     */
    hideNotification() {
        this.elements.notificationBadge.style.display = 'none';
    }

    // ===== ENHANCED INTELLIGENT METHODS =====

    /**
     * Get time of day for contextual greetings
     */
    getTimeOfDay() {
        const hour = new Date().getHours();
        if (hour < 12) return 'morning';
        if (hour < 17) return 'afternoon';
        return 'evening';
    }

    /**
     * Enhanced technology extraction with synonyms
     */
    extractTechnology(message) {
        const techSynonyms = {
            'python': ['python', 'django', 'flask', 'fastapi'],
            'java': ['java', 'spring', 'spring boot', 'maven', 'gradle'],
            'javascript': ['javascript', 'js', 'node', 'nodejs', 'react', 'vue', 'angular', 'express'],
            'csharp': ['c#', 'csharp', '.net', 'asp.net'],
            'cpp': ['c++', 'cpp', 'qt'],
            'php': ['php', 'laravel', 'symfony'],
            'react': ['react', 'reactjs', 'react native'],
            'angular': ['angular', 'angularjs'],
            'vue': ['vue', 'vuejs'],
            'django': ['django', 'python django'],
            'mysql': ['mysql', 'sql'],
            'mongodb': ['mongodb', 'mongo'],
            'docker': ['docker', 'container'],
            'git': ['git', 'github'],
            'ai': ['ai', 'artificial intelligence', 'machine learning', 'ml'],
            'neural': ['neural network', 'deep learning', 'tensorflow']
        };

        const lowerMessage = message.toLowerCase();
        for (const [tech, synonyms] of Object.entries(techSynonyms)) {
            if (synonyms.some(synonym => lowerMessage.includes(synonym))) {
                return tech;
            }
        }
        return 'technology';
    }

    /**
     * Extract company names from message
     */
    extractCompany(message) {
        const companies = ['industrial 4.0 research center', 'caretta software', 'tawhid almas logistics'];
        const lowerMessage = message.toLowerCase();
        return companies.find(company => lowerMessage.includes(company));
    }

    /**
     * Extract role/job titles from message
     */
    extractRole(message) {
        const roles = ['researcher intern', 'engineering researcher intern', 'frontend developer intern', 'research assistant intern', 'network technician'];
        const lowerMessage = message.toLowerCase();
        return roles.find(role => lowerMessage.includes(role));
    }

    /**
     * Extract project names from message
     */
    extractProject(message) {
        const lowerMessage = message.toLowerCase();
        return this.knowledgeBase.projects.find(project =>
            lowerMessage.includes(project.name.toLowerCase()) ||
            project.technologies.some(tech => lowerMessage.includes(tech.toLowerCase()))
        );
    }

    /**
     * Handle specific technology questions
     */
    handleSpecificTechnology(kb, tech) {
        const techResponses = {
            'python': `Tariq has extensive Python experience, particularly with Django framework. He's built full-stack applications using Python/Django backend with databases like PostgreSQL and MongoDB. His Python skills include web development, data analysis, and machine learning applications.`,
            'java': `Tariq is proficient in Java development, especially with Spring Boot framework. He's created enterprise-level applications including hospital management systems and RESTful APIs. His Java expertise covers object-oriented programming, design patterns, and microservices architecture.`,
            'javascript': `Tariq has strong JavaScript skills across the full stack. He works with React for frontend development, Node.js for backend services, and has built interactive web applications. His JavaScript projects include quiz platforms, portfolio sites, and dynamic user interfaces.`,
            'react': `Tariq has hands-on experience with React, including React Native for mobile development. He's built cross-platform mobile apps with Firebase integration and responsive web interfaces with modern React patterns.`,
            'django': `Tariq specializes in Django for robust web applications. He's developed full-featured platforms with Django including authentication systems, database management, and REST APIs. His Django projects showcase clean architecture and best practices.`,
            'mysql': `Tariq has extensive experience with MySQL database design and management. He's worked on complex database schemas, query optimization, and data modeling for various applications including hotel management and note-taking systems.`,
            'mongodb': `Tariq works with MongoDB for NoSQL database solutions. He's implemented MongoDB in mobile applications and web platforms requiring flexible data structures and real-time synchronization.`,
            'docker': `Tariq understands containerization with Docker. He's used Docker for development environments, deployment pipelines, and microservices architecture in his projects.`,
            'git': `Tariq is proficient with Git version control. He maintains active GitHub repositories for all his projects and follows best practices for collaborative development and code management.`,
            'ai': `Tariq has experience with AI and machine learning applications. He's worked on neural network projects, implemented classification algorithms, and understands modern AI frameworks like TensorFlow.`
        };

        return techResponses[tech] || `Tariq has experience with ${tech} and has applied it in various projects. Would you like to see specific examples of his work with this technology?`;
    }

    /**
     * Handle specific experience questions
     */
    handleSpecificExperience(kb, company, role) {
        if (company) {
            const experience = kb.experience.find(exp => exp.company.toLowerCase().includes(company.toLowerCase()));
            if (experience) {
                return `**${experience.title}** at ${experience.company}
📅 ${experience.duration}
📍 ${experience.location || 'Remote'}

**Key Responsibilities:**
${experience.responsibilities.map(resp => `• ${resp}`).join('\n')}

This role allowed Tariq to develop expertise in ${experience.responsibilities.slice(0, 2).join(' and ').toLowerCase()}.`;
            }
        }

        if (role) {
            const experience = kb.experience.find(exp => exp.title.toLowerCase().includes(role.toLowerCase()));
            if (experience) {
                return `Regarding his role as **${experience.title}** at ${experience.company}:

📅 ${experience.duration}
📍 ${experience.location || 'Remote'}

**Key Achievements:**
${experience.responsibilities.map(resp => `• ${resp}`).join('\n')}

This position helped Tariq develop valuable skills in research methodology and technical implementation.`;
            }
        }

        return "I'd be happy to tell you more about specific roles or companies. Could you be more specific about which experience you'd like to know about?";
    }

    /**
     * Handle specific project questions
     */
    handleSpecificProject(kb, project) {
        if (!project) return "I'd love to tell you about a specific project. Which one interests you?";

        let response = `**${project.name}**

*Technologies Used:* ${project.technologies.join(', ')}

${project.description}

**Key Features & Outcomes:**
${project.details.map(detail => `• ${detail}`).join('\n')}`;

        if (project.liveDemo) response += `\n\n🌐 [View Live Demo](${project.liveDemo})`;
        if (project.github) response += `\n📚 [View Source Code](${project.github})`;

        return response;
    }

    /**
     * Handle projects filtered by technology
     */
    handleProjectsByTechnology(kb, tech) {
        const relevantProjects = kb.projects.filter(project =>
            project.technologies.some(projectTech =>
                projectTech.toLowerCase().includes(tech.toLowerCase())
            )
        );

        if (relevantProjects.length === 0) {
            return `Tariq hasn't worked on any projects specifically using ${tech}, but he's familiar with the technology and eager to apply it in future projects. Would you like to see his work in related technologies?`;
        }

        let response = `Here are projects where Tariq used ${tech}:\n\n`;
        relevantProjects.forEach(project => {
            response += `**${project.name}**\n`;
            response += `*Technologies: ${project.technologies.join(', ')}*\n`;
            response += `${project.description}\n\n`;
        });

        return response;
    }

    /**
     * Handle Who questions intelligently
     */
    handleWhoQuestion(kb, message) {
        const lowerMessage = message.toLowerCase();

        if (lowerMessage.includes('tariq') && (lowerMessage.includes('is') || lowerMessage.includes('are'))) {
            return `Tariq Ahmad is a talented Computer Engineer based in ${kb.personal.location}. He's a ${new Date().getFullYear() - 2000}-year-old graduate from ${kb.personal.university} with a passion for full-stack development and research in Industry 4.0 technologies. Currently working as a Researcher Intern, he's known for his expertise in Python/Django, Java/Spring Boot, and modern web technologies.`;
        }

        if (lowerMessage.includes('work') || lowerMessage.includes('company')) {
            return `Tariq currently works as a Researcher Intern at Industrial 4.0 Research Center in Istanbul, Turkey. He's also worked at Caretta Software Company as a Frontend Developer Intern and Tawhid Almas Logistics Company as a Network Technician.`;
        }

        if (lowerMessage.includes('recommend') || lowerMessage.includes('supervisor') || lowerMessage.includes('professor')) {
            return `Several professors and colleagues have provided testimonials for Tariq. His research supervisor Alparslan Horasan praises his problem-solving abilities, while Selçuk Şener highlights his teamwork skills. Roa'a Ali and Wasim Raed commend his technical expertise, and Zafer Aslan notes his dedication to continuous learning.`;
        }

        return "Tariq Ahmad is a Computer Engineer and full-stack developer specializing in Python, Java, and JavaScript technologies. He's passionate about creating innovative solutions and has experience in research, software development, and system design.";
    }

    /**
     * Handle What questions intelligently
     */
    handleWhatQuestion(kb, message) {
        const lowerMessage = message.toLowerCase();

        if (lowerMessage.includes('do') && lowerMessage.includes('do')) {
            return `Tariq specializes in full-stack web development, research in Industry 4.0 technologies, and software engineering. He builds web applications using Python/Django, Java/Spring Boot, and React. He's also experienced in mobile app development, database design, and system architecture.`;
        }

        if (lowerMessage.includes('study') || lowerMessage.includes('major')) {
            return `Tariq studied Computer Engineering at Istanbul Aydin University, graduating in 2021-2025 with a CGPA of ${kb.personal.cgpa}/4.0. His studies focused on software engineering, data structures, algorithms, and computer systems.`;
        }

        if (lowerMessage.includes('skill') || lowerMessage.includes('expertise')) {
            return this.intentHandlers.find(h => h.name === 'skills').handler(kb, message);
        }

        if (lowerMessage.includes('project') || lowerMessage.includes('build')) {
            return this.intentHandlers.find(h => h.name === 'projects').handler(kb, message);
        }

        if (lowerMessage.includes('certification') || lowerMessage.includes('course')) {
            return this.intentHandlers.find(h => h.name === 'certifications').handler(kb, message);
        }

        return "Tariq is a Computer Engineer specializing in full-stack development with expertise in Python, Java, JavaScript, and database technologies. He has hands-on experience building web applications, mobile apps, and research projects.";
    }

    /**
     * Handle Where questions intelligently
     */
    handleWhereQuestion(kb, message) {
        const lowerMessage = message.toLowerCase();

        if (lowerMessage.includes('live') || lowerMessage.includes('from') || lowerMessage.includes('location')) {
            return `Tariq currently lives in ${kb.personal.location}. He's based in Istanbul, Turkey, where he studies and works. This location gives him access to Turkey's growing tech scene and international opportunities.`;
        }

        if (lowerMessage.includes('work') || lowerMessage.includes('company')) {
            return `Tariq works at Industrial 4.0 Research Center in Istanbul, Turkey. He has also worked at Caretta Software Company and Tawhid Almas Logistics Company, both located in Istanbul.`;
        }

        if (lowerMessage.includes('study') || lowerMessage.includes('university') || lowerMessage.includes('school')) {
            return `Tariq studied at Istanbul Aydin University in Istanbul, Turkey. He completed his Computer Engineering degree there, gaining both theoretical knowledge and practical experience in software development.`;
        }

        return `Tariq is based in ${kb.personal.location}, specifically Istanbul, Turkey. This vibrant city provides him with excellent opportunities in the tech industry and access to international collaborations.`;
    }

    /**
     * Handle When questions intelligently
     */
    handleWhenQuestion(kb, message) {
        const lowerMessage = message.toLowerCase();

        if (lowerMessage.includes('graduate') || lowerMessage.includes('finish') || lowerMessage.includes('complete')) {
            return `Tariq graduated from Istanbul Aydin University in ${kb.personal.graduationYear.split('-')[1]} with a Bachelor's degree in Computer Engineering. He achieved a CGPA of ${kb.personal.cgpa}/4.0 in his studies.`;
        }

        if (lowerMessage.includes('start') && lowerMessage.includes('work')) {
            return `Tariq started his professional career in 2023. He began with a Network Technician role at Tawhid Almas Logistics Company in July 2023, then moved to research and development roles at Caretta Software Company and Industrial 4.0 Research Center.`;
        }

        if (lowerMessage.includes('born') || lowerMessage.includes('birthday')) {
            return `Tariq was born on ${kb.personal.birthday} in ${kb.personal.birthday.split(' ')[2]}, making him ${new Date().getFullYear() - 2000} years old. He's a young professional bringing fresh perspectives to software development and research.`;
        }

        if (lowerMessage.includes('available') || lowerMessage.includes('free')) {
            return `Tariq is currently available for freelance projects and new opportunities. He's actively seeking full-time positions and collaborations in software development and research. Feel free to reach out to discuss potential projects!`;
        }

        return `Tariq graduated in ${kb.personal.graduationYear.split('-')[1]} and has been building his career since 2023. He's continuously learning and adapting to new technologies, making him well-prepared for current industry demands.`;
    }

    /**
     * Handle How questions intelligently
     */
    handleHowQuestion(kb, message) {
        const lowerMessage = message.toLowerCase();

        if (lowerMessage.includes('many') && (lowerMessage.includes('project') || lowerMessage.includes('experience'))) {
            return `Tariq has completed ${kb.stats.projects} projects and has ${kb.experience.length} professional experiences. He maintains an active portfolio with diverse applications including web platforms, mobile apps, and research implementations.`;
        }

        if (lowerMessage.includes('long') && lowerMessage.includes('experience')) {
            return `Tariq has been building professional experience since July 2023, accumulating about ${Math.floor((new Date() - new Date('2023-07-01')) / (1000 * 60 * 60 * 24 * 30))} months in the industry. His experience spans network administration, frontend development, research assistance, and engineering research.`;
        }

        if (lowerMessage.includes('contact') || lowerMessage.includes('reach')) {
            return this.intentHandlers.find(h => h.name === 'contact').handler(kb, message);
        }

        if (lowerMessage.includes('work') || lowerMessage.includes('approach')) {
            return this.intentHandlers.find(h => h.name === 'philosophy').handler(kb, message);
        }

        if (lowerMessage.includes('old') || lowerMessage.includes('age')) {
            const age = new Date().getFullYear() - 2000;
            return `Tariq is ${age} years old, born on ${kb.personal.birthday}. His youth brings fresh perspectives and enthusiasm to technology, combined with solid academic training and practical experience.`;
        }

        return "Tariq approaches his work with dedication and continuous learning. He combines academic knowledge with practical experience, focusing on quality solutions and user-centric design. He's built his expertise through hands-on projects and professional roles.";
    }

    /**
     * Handle Why questions intelligently
     */
    handleWhyQuestion(kb, message) {
        const lowerMessage = message.toLowerCase();

        if (lowerMessage.includes('choose') && lowerMessage.includes('computer')) {
            return `Tariq chose Computer Engineering because of his passion for technology and problem-solving. He was drawn to the field by the opportunity to create innovative solutions and the constant evolution of technology. His interest in how systems work and his desire to build useful applications led him to this rewarding career path.`;
        }

        if (lowerMessage.includes('work') && lowerMessage.includes('research')) {
            return `Tariq works in research because he's fascinated by cutting-edge technologies and their practical applications. Research allows him to explore Industry 4.0 concepts, contribute to technological advancement, and develop innovative solutions for real-world industrial challenges.`;
        }

        if (lowerMessage.includes('freelance') || lowerMessage.includes('available')) {
            return `Tariq is available for freelance work because he enjoys taking on diverse projects and collaborating with different teams. Freelancing allows him to apply his skills broadly, learn new technologies, and build relationships in the tech community. He's particularly interested in innovative projects and challenging technical problems.`;
        }

        if (lowerMessage.includes('recommend')) {
            return `People recommend Tariq because of his technical expertise, reliability, and collaborative approach. His professors and colleagues praise his problem-solving abilities, dedication to quality work, and passion for technology. His track record of successful projects and positive work relationships speaks to his professional competence.`;
        }

        return "Tariq's career choices are driven by his passion for technology, desire for continuous learning, and interest in creating meaningful solutions. He believes in the power of technology to solve real-world problems and contribute to industrial advancement.";
    }

    /**
     * Handle follow-up questions based on conversation context
     */
    handleFollowUp(kb, message) {
        const currentTopic = this.conversationMemory.currentTopic;

        if (currentTopic === 'skills') {
            return `To expand on Tariq's technical skills:

**Advanced Skills:**
• System Design & Architecture
• API Development (RESTful & GraphQL)
• Database Design & Optimization
• Version Control & CI/CD
• Cloud Services & Deployment

**Soft Skills:**
• Problem-Solving & Analytical Thinking
• Team Collaboration & Communication
• Project Management & Time Planning
• Research & Documentation
• Client Relations & Requirements Gathering

He's continuously expanding his skill set through new projects and learning opportunities.`;
        }

        if (currentTopic === 'experience') {
            return `Let me provide more context about Tariq's career progression:

**Career Journey:**
• Started with network infrastructure fundamentals
• Moved to frontend development with modern frameworks
• Advanced to research and engineering roles
• Currently focused on Industry 4.0 technologies

**Key Learnings:**
• Practical application of academic knowledge
• Importance of research in technology development
• Value of interdisciplinary collaboration
• Significance of user-centric design principles

Each role has built upon the previous, creating a strong foundation in both technical and research skills.`;
        }

        if (currentTopic === 'projects') {
            return `Tariq's project portfolio showcases his versatility:

**Project Highlights:**
• Full-stack web applications with Django/Python
• Mobile apps with React Native
• Database-driven systems with multiple technologies
• Research implementations and prototypes
• Real-world problem-solving applications

**Development Approach:**
• User-centered design principles
• Clean, maintainable code architecture
• Comprehensive testing and documentation
• Performance optimization and security
• Scalable and maintainable solutions

His projects demonstrate both technical proficiency and practical application of engineering principles.`;
        }

        return "I'd be happy to provide more details! Could you let me know which aspect you'd like me to expand on? I can tell you more about his skills, experience, projects, or any other area of his background.";
    }

    /**
     * Handle comparisons and preferences
     */
    handleComparison(kb, message) {
        const lowerMessage = message.toLowerCase();

        if (lowerMessage.includes('python') && lowerMessage.includes('java')) {
            return `Tariq has strong proficiency in both Python and Java:

**Python Strengths:**
• Rapid development and prototyping
• Excellent for web development (Django)
• Great for data science and AI applications
• Cleaner, more readable syntax

**Java Strengths:**
• Enterprise-grade applications
• Strong typing and performance
• Spring Boot for robust backend systems
• Excellent for large-scale applications

**Tariq's Preference:** He enjoys both but often chooses Python for web development and Java for enterprise systems, depending on project requirements.`;
        }

        if (lowerMessage.includes('react') && lowerMessage.includes('angular')) {
            return `Tariq has experience with both React and Angular:

**React:**
• More flexible and component-based
• Easier learning curve for JavaScript developers
• Better for smaller to medium projects
• Used in his Quizlet project

**Angular:**
• More structured and opinionated
• Better for large enterprise applications
• Steeper learning curve but more comprehensive
• Strong TypeScript integration

**Tariq's Experience:** He's more hands-on with React but understands Angular's architecture and would be comfortable working with either framework.`;
        }

        if (lowerMessage.includes('sql') && lowerMessage.includes('nosql')) {
            return `Tariq works with both SQL and NoSQL databases:

**SQL Databases (MySQL, PostgreSQL):**
• Structured data and complex relationships
• ACID compliance and data integrity
• Excellent for transactional systems
• Used in his Hospital Management System

**NoSQL Databases (MongoDB):**
• Flexible schema and scalability
• Better for unstructured data
• High performance for certain use cases
• Used in his mobile applications

**Tariq's Approach:** He chooses the database technology based on the specific project requirements and data structure needs.`;
        }

        return "Tariq believes different technologies excel in different scenarios. His approach is to choose the best tool for each specific project requirement rather than having rigid preferences. He's adaptable and continuously learning new technologies as needed.";
    }

    /**
     * Intelligent fallback that tries to understand and respond helpfully
     */
    handleIntelligentFallback(kb, message) {
        const lowerMessage = message.toLowerCase();

        // Try to identify the intent even if not perfectly matched
        if (lowerMessage.includes('hire') || lowerMessage.includes('job') || lowerMessage.includes('opportunity')) {
            return this.intentHandlers.find(h => h.name === 'availability').handler(kb, message);
        }

        if (lowerMessage.includes('price') || lowerMessage.includes('cost') || lowerMessage.includes('rate')) {
            return "Regarding rates and pricing, Tariq is open to discussing project-based compensation. His rates depend on project complexity, timeline, and specific requirements. He believes in fair pricing that reflects the value delivered. Feel free to contact him directly to discuss your project needs!";
        }

        if (lowerMessage.includes('help') || lowerMessage.includes('assist')) {
            return "I'm here to help! I can provide information about Tariq's skills, experience, projects, education, certifications, and contact information. You can ask questions like:\n\n• What technologies does he work with?\n• Can you show me his projects?\n• What's his professional background?\n• How can I contact him?\n\nWhat would you like to know?";
        }

        if (lowerMessage.includes('thank')) {
            return "You're very welcome! I'm glad I could help you learn more about Tariq Ahmad. He's a talented developer with a bright future in technology. If you have any more questions, feel free to ask anytime!";
        }

        // Check for entities mentioned in the message
        const mentionedEntities = this.extractEntities(message);
        if (mentionedEntities.length > 0) {
            return this.handleEntityMentions(kb, mentionedEntities, message);
        }

        // Generic helpful response
        const helpfulResponses = [
            "I'd be delighted to help you learn more about Tariq Ahmad! I'm his AI assistant and can provide detailed information about his skills, experience, projects, and background. What specific aspect interests you?",
            "I'm here to share insights about Tariq's professional journey. Whether you're interested in his technical expertise, project portfolio, or career achievements, I can provide comprehensive information. What would you like to explore?",
            "Tariq is a skilled Computer Engineer with expertise in full-stack development and research. I can tell you about his programming skills, professional experience, notable projects, or how to get in touch. What would you like to know?",
            "I'm Tariq's professional assistant, ready to answer questions about his background, skills, and achievements. Feel free to ask about anything from his technical expertise to his career goals!"
        ];

        return this.getRandomResponse(helpfulResponses);
    }

    /**
     * Extract entities (technologies, companies, etc.) from message
     */
    extractEntities(message) {
        const entities = [];
        const lowerMessage = message.toLowerCase();

        // Check for technologies
        const tech = this.extractTechnology(message);
        if (tech !== 'technology') entities.push({ type: 'technology', value: tech });

        // Check for companies
        const company = this.extractCompany(message);
        if (company) entities.push({ type: 'company', value: company });

        // Check for projects
        const project = this.extractProject(message);
        if (project) entities.push({ type: 'project', value: project.name });

        return entities;
    }

    /**
     * Handle entity mentions intelligently
     */
    handleEntityMentions(kb, entities, originalMessage) {
        const primaryEntity = entities[0];

        if (primaryEntity.type === 'technology') {
            return this.handleSpecificTechnology(kb, primaryEntity.value);
        }

        if (primaryEntity.type === 'company') {
            return this.handleSpecificExperience(kb, primaryEntity.value, null);
        }

        if (primaryEntity.type === 'project') {
            const project = kb.projects.find(p => p.name === primaryEntity.value);
            return this.handleSpecificProject(kb, project);
        }

        return "I noticed you mentioned something specific. Could you clarify what you'd like to know about it?";
    }

    /**
     * Generate AI response based on user message
     */
    async generateResponse(message) {
        // Simulate thinking time
        await new Promise(resolve => setTimeout(resolve, 800 + Math.random() * 1200));

        const normalizedMessage = message.toLowerCase();
        this.conversationContext.push(normalizedMessage);
        if (this.conversationContext.length > 10) {
            this.conversationContext = this.conversationContext.slice(-10);
        }

        // Update conversation memory
        this.conversationMemory.questionHistory.push({
            message: normalizedMessage,
            timestamp: new Date()
        });
        if (this.conversationMemory.questionHistory.length > 5) {
            this.conversationMemory.questionHistory = this.conversationMemory.questionHistory.slice(-5);
        }

        // Enhanced intent matching with prioritization
        const matchedIntent = this.findBestIntentMatch(normalizedMessage);

        if (matchedIntent) {
            try {
                const response = matchedIntent.handler(this.knowledgeBase, message);

                // Update conversation memory
                this.conversationMemory.mentionedEntities.clear();
                const entities = this.extractEntities(message);
                entities.forEach(entity => this.conversationMemory.mentionedEntities.add(entity.value));

                return response;
            } catch (error) {
                console.error('Intent handler error:', error);
                // Fall back to intelligent fallback
                return this.handleIntelligentFallback(this.knowledgeBase, message);
            }
        }

        // If no intent matched, use intelligent fallback
        return this.handleIntelligentFallback(this.knowledgeBase, message);
    }

    /**
     * Enhanced intent matching with scoring and prioritization
     */
    findBestIntentMatch(message) {
        let bestMatch = null;
        let bestScore = 0;

        for (const intent of this.intentHandlers) {
            const score = this.calculateIntentScore(message, intent);

            // Prioritize certain intents based on priority property
            const priorityBonus = intent.priority || 1;
            const finalScore = score * priorityBonus;

            if (finalScore > bestScore && finalScore > 0.3) { // Minimum threshold
                bestScore = finalScore;
                bestMatch = intent;
            }
        }

        return bestMatch;
    }

    /**
     * Calculate how well an intent matches the message
     */
    calculateIntentScore(message, intent) {
        let score = 0;
        const lowerMessage = message.toLowerCase();

        // Check pattern matches
        for (const pattern of intent.patterns) {
            if (lowerMessage.includes(pattern.toLowerCase())) {
                score += 1;

                // Bonus for exact word matches
                if (pattern.includes(' ')) {
                    score += 0.5; // Multi-word patterns get bonus
                }
            }
        }

        // Domain-specific keyword bonuses
        const techKeywords = ['technology', 'technologies', 'programming', 'language', 'framework', 'database', 'tool', 'skill'];
        const hasTechKeyword = techKeywords.some(keyword => lowerMessage.includes(keyword));

        if (intent.name === 'skills' && hasTechKeyword) {
            score += 2.0; // Strong bonus for skills intent when tech keywords present
        }

        // Context-based scoring
        if (this.conversationMemory.currentTopic) {
            if (intent.name.includes(this.conversationMemory.currentTopic)) {
                score += 0.8; // Topic continuity bonus
            }
        }

        // Recent question type bonus
        if (this.conversationMemory.questionHistory.length > 0) {
            const lastQuestion = this.conversationMemory.questionHistory[this.conversationMemory.questionHistory.length - 1];
            if (lastQuestion.type && intent.name.includes(lastQuestion.type)) {
                score += 0.3; // Question type continuity
            }
        }

        // For intents with many patterns, be more lenient
        const patternCount = intent.patterns.length;
        if (patternCount > 10) {
            // Use a more lenient normalization for intents with many patterns
            return Math.min(score / Math.sqrt(patternCount), 1);
        }

        // Normalize score
        return Math.min(score / patternCount, 1);
    }

    /**
     * Check if message matches any of the given patterns
     */
    matchesPattern(message, patterns) {
        return patterns.some(pattern => message.includes(pattern.toLowerCase()));
    }

    /**
     * Extract technology name from message
     */
    extractTechnology(message) {
        const technologies = ['python', 'java', 'javascript', 'react', 'django', 'spring boot', 'mysql', 'mongodb', 'docker', 'git'];
        return technologies.find(tech => message.toLowerCase().includes(tech)) || 'technology';
    }

    /**
     * Get random response from array
     */
    getRandomResponse(responses) {
        return responses[Math.floor(Math.random() * responses.length)];
    }
}

// Initialize the AI Assistant when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    // Wait a bit to ensure all other scripts are loaded
    setTimeout(() => {
        window.aiAssistant = new AIAssistant();
    }, 1000);
});
