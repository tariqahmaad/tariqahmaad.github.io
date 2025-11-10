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
        this.notificationCount = 0;
        this.hasNotifications = false;
        this.lastTopic = null;
        this.intentHandlers = this.initializeIntentHandlers();
        this.conversationMemory = {
            currentTopic: null,
            mentionedEntities: new Set(),
            userPreferences: {},
            questionHistory: []
        };
        this.touchInteractionsAdded = false;
        this.isInitialized = false; // Add flag to track initialization state

        // Enhanced personality system
        this.personality = {
            traits: {
                enthusiastic: 0.8,
                professional: 0.9,
                humor: 0.6,
                empathy: 0.7,
                techSavvy: 0.9
            },
            currentMood: 'professional',
            userInteractionStyle: 'neutral',
            conversationDepth: 0,
            engagementLevel: 0
        };

        // Enhanced user profiling
        this.userProfile = {
            visitCount: 0,
            interests: new Set(),
            technicalLevel: 'intermediate',
            communicationStyle: 'professional',
            lastVisit: null,
            totalInteractions: 0,
            preferredTopics: []
        };

        // Response variation system
        this.responseVariations = this.initializeResponseVariations();
        this.personalityExpressions = this.initializePersonalityExpressions();
        this.contextualResponses = this.initializeContextualResponses();

        // Initialize knowledge base with portfolio data
        this.knowledgeBase = knowledgeBase;

        // Check if assistant should be disabled on mobile for non-home sections
        this.isDisabled = this.shouldDisableAssistant();
        if (this.isDisabled) {
            return;
        }

        // Set initial state based on viewport size before any other operations
        const isSmallPhone = window.matchMedia('(max-width: 479px)').matches;
        this.isMinimized = true; // Start minimized by default

        // Initialize the assistant
        this.init();

        // Set up scroll listener for small phones to hide/show assistant based on section
        if (isSmallPhone) {
            this.setupSectionWatcher();
        }

        // Set up resize listener to handle viewport changes
        this.setupResizeListener();

    }

    shouldDisableAssistant() {
        // Only disable on small phones (< 480px), enable on tablets
        const isSmallPhone = window.matchMedia('(max-width: 479px)').matches;
        if (!isSmallPhone) {
            return false;
        }

        // Check if we're in the home/header section on small phones
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
            // Skip section checking during initialization to prevent conflicts
            if (!this.isInitialized) {
                return;
            }

            const currentSection = this.getCurrentSection();

            // Only update if section actually changed
            if (currentSection !== lastSection) {
                lastSection = currentSection;
                // Only hide on mobile devices (not tablets or laptops)
                const isMobileViewport = window.matchMedia('(max-width: 767px)').matches;
                const shouldHide = isMobileViewport && currentSection !== 'header' && currentSection !== 'home';

                if (this.elements && this.elements.assistant) {
                    if (shouldHide) {
                        this.elements.assistant.classList.add('hidden');
                        // Also close the chat if it's open
                        if (!this.isMinimized) {
                            this.closeChat();
                        }
                    } else {
                        this.elements.assistant.classList.remove('hidden');
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

        // Don't run immediate check during initialization
        // This will be handled after initialization is complete
    }

    initializeIntentHandlers() {
        return [
            // Enhanced Greeting and Introduction
            {
                name: 'greeting',
                patterns: [
                    'hello', 'hi', 'hey', 'greetings', 'good morning', 'good afternoon', 'good evening',
                    'howdy', 'hola', 'bonjour', 'ciao', 'aloha', 'hi there', 'hey there', 'yo', 'sup',
                    'what\'s up', 'how are you', 'how do you do', 'nice to meet you', 'pleased to meet you',
                    'good day', 'welcome', 'hey there', 'hiya', 'g\'day', 'howdy partner'
                ],
                handler: (kb, message) => {
                    this.conversationMemory.currentTopic = 'introduction';
                    this.updateUserInteraction('greeting');
                    this.personality.currentMood = 'enthusiastic';

                    const timeOfDay = this.getTimeOfDay();
                    const isReturningUser = this.userProfile.visitCount > 0;

                    let responses;
                    if (isReturningUser) {
                        responses = this.getReturningUserGreetings(timeOfDay);
                    } else {
                        responses = this.getFirstTimeGreetings(timeOfDay);
                    }

                    const baseResponse = this.getRandomResponse(responses);
                    const personalityEnhanced = this.addPersonalityToResponse(baseResponse, 'greeting');
                    const contextualAddition = this.getContextualGreetingAddition();

                    return `${personalityEnhanced}${contextualAddition}`;
                }
            },

            // Enhanced Skills and Technical Expertise
            {
                name: 'skills',
                patterns: [
                    'skill', 'skills', 'technology', 'technologies', 'programming', 'language', 'languages',
                    'framework', 'frameworks', 'tool', 'tools', 'tech stack', 'expertise', 'competence',
                    'competent', 'proficient', 'specialize', 'specialized', 'work with', 'do you use',
                    'what do you', 'tech', 'technical', 'coding', 'development', 'software', 'what technologies',
                    'what languages', 'what programming', 'what frameworks', 'what tools', 'technical skills',
                    'programming languages', 'development tools', 'software stack', 'technology stack',
                    'what can you do', 'what are you good at', 'what are your strengths', 'technical abilities'
                ],
                handler: (kb, message) => {
                    this.conversationMemory.currentTopic = 'skills';
                    this.updateUserInteraction('technical');
                    this.userProfile.interests.add('technical_skills');

                    const specificTech = this.extractTechnology(message);
                    if (specificTech !== 'technology') {
                        return this.handleSpecificTechnology(kb, specificTech);
                    }

                    // Dynamic response based on user interaction style
                    const isEnthusiasticUser = this.personality.engagementLevel > 0.7;

                    let baseResponse;
                    if (isEnthusiasticUser) {
                        baseResponse = this.getEnthusiasticSkillsResponse(kb);
                    } else {
                        baseResponse = this.getProfessionalSkillsResponse(kb);
                    }

                    const personalityEnhanced = this.addPersonalityToResponse(baseResponse, 'skills');
                    const followUpQuestion = this.getRandomResponse(this.contextualResponses.followUpQuestions.skills);
                    const contextualAddition = this.getRandomResponse(this.contextualResponses.contextualAdditions.learning);

                    return `${personalityEnhanced}

${followUpQuestion}

${contextualAddition}`;
                }
            },

            // Enhanced Work Experience
            {
                name: 'experience',
                patterns: [
                    'experience', 'work', 'job', 'career', 'employment', 'intern', 'internship', 'position',
                    'role', 'worked', 'employed', 'professional background', 'work history', 'job background',
                    'career path', 'previous work', 'past experience', 'professional experience', 'work experience',
                    'where has he worked', 'what jobs', 'what companies', 'previous positions', 'former roles',
                    'career journey', 'professional journey', 'employment history', 'job titles', 'work roles'
                ],
                handler: (kb, message) => {
                    this.conversationMemory.currentTopic = 'experience';
                    this.updateUserInteraction('experience');
                    this.userProfile.interests.add('professional_experience');

                    const specificCompany = this.extractCompany(message);
                    const specificRole = this.extractRole(message);

                    if (specificCompany || specificRole) {
                        return this.handleSpecificExperience(kb, specificCompany, specificRole);
                    }

                    // Dynamic response based on user interaction style
                    const isEnthusiasticUser = this.personality.engagementLevel > 0.7;

                    let baseResponse;
                    if (isEnthusiasticUser) {
                        baseResponse = this.getEnthusiasticExperienceResponse(kb);
                    } else {
                        baseResponse = this.getProfessionalExperienceResponse(kb);
                    }

                    const personalityEnhanced = this.addPersonalityToResponse(baseResponse, 'experience');
                    const followUpQuestion = this.getRandomResponse(this.contextualResponses.followUpQuestions.experience);
                    const contextualAddition = this.getRandomResponse(this.contextualResponses.contextualAdditions.career);

                    return `${personalityEnhanced}

${followUpQuestion}

${contextualAddition}`;
                }
            },

            // Enhanced Projects and Portfolio
            {
                name: 'projects',
                patterns: [
                    'project', 'projects', 'portfolio', 'work', 'build', 'develop', 'create', 'application',
                    'app', 'made', 'built', 'created', 'developed', 'work examples', 'examples', 'showcase',
                    'demos', 'what has he built', 'what has he made', 'what has he created', 'what projects',
                    'portfolio pieces', 'work samples', 'sample work', 'demonstrations', 'case studies',
                    'real world applications', 'practical work', 'implementations', 'solutions', 'products'
                ],
                handler: (kb, message) => {
                    this.conversationMemory.currentTopic = 'projects';
                    this.updateUserInteraction('projects');
                    this.userProfile.interests.add('projects');

                    const specificProject = this.extractProject(message);
                    const techFilter = this.extractTechnology(message);

                    if (specificProject) {
                        return this.handleSpecificProject(kb, specificProject);
                    }

                    if (techFilter !== 'technology') {
                        return this.handleProjectsByTechnology(kb, techFilter);
                    }

                    // Dynamic response based on user interaction style
                    const isEnthusiasticUser = this.personality.engagementLevel > 0.7;

                    let baseResponse;
                    if (isEnthusiasticUser) {
                        baseResponse = this.getEnthusiasticProjectsResponse(kb);
                    } else {
                        baseResponse = this.getProfessionalProjectsResponse(kb);
                    }

                    const personalityEnhanced = this.addPersonalityToResponse(baseResponse, 'projects');
                    const followUpQuestion = this.getRandomResponse(this.contextualResponses.followUpQuestions.projects);
                    const contextualAddition = this.getRandomResponse(this.contextualResponses.contextualAdditions.innovation);

                    return `${personalityEnhanced}

${followUpQuestion}

${contextualAddition}`;
                }
            },

            // Education and Academic Background
            {
                name: 'education',
                patterns: [
                    'education', 'university', 'degree', 'study', 'school', 'academic', 'qualification',
                    'college', 'graduation', 'cgpa', 'gpa', 'academic background', 'educational background',
                    'where did he study', 'what degree', 'what university', 'what college', 'educational history',
                    'academic qualifications', 'higher education', 'formal education', 'learning background',
                    'studies', 'alumni', 'campus', 'academic achievements', 'scholarship', 'research'
                ],
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
                patterns: [
                    'contact', 'reach', 'email', 'phone', 'hire', 'get in touch', 'reach out', 'how to contact',
                    'how to reach', 'contact information', 'contact details', 'get ahold of', 'connect with',
                    'how can i contact', 'how can i reach', 'where to contact', 'contact methods', 'ways to connect',
                    'social media', 'linkedin', 'github', 'twitter', 'facebook', 'instagram', 'professional network'
                ],
                handler: (kb) => {
                    return `You can contact Tariq through:

📧 **Email:** ${kb.personal.email}
📱 **Phone:** ${kb.personal.phone}
📍 **Location:** ${kb.personal.location}
💼 **LinkedIn:** [Connect with Tariq](${kb.personal.linkedin})
💻 **GitHub:** [View Code](${kb.personal.github})
🐦 **Twitter:** [Follow Tariq](${kb.personal.twitter})
📘 **Facebook:** [Connect with Tariq](${kb.personal.facebook})
📷 **Instagram:** [Follow Tariq](${kb.personal.instagram})

**Freelance Status:** ${kb.personal.freelance} ✅

He's actively seeking new opportunities and open to discussing projects!`;
                }
            },
            {
                name: 'about',
                patterns: [
                    'about', 'who', 'person', 'background', 'tell me', 'introduce', 'who is tariq',
                    'what is tariq', 'tell me about tariq', 'who is he', 'what is he like', 'personal info',
                    'personal information', 'profile', 'bio', 'biography', 'who am i talking to', 'who are you',
                    'what can you tell me', 'summary', 'overview', 'general information', 'basic info'
                ],
                handler: (kb) => {
                    return `Let me tell you about Tariq Ahmad:

👨‍💻 **Computer Engineer** from ${kb.personal.location}
🎓 Graduate from ${kb.personal.university}
🏢 Currently working as a **${kb.experience[0].title}** at ${kb.experience[0].company}

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
• ${kb.certifications.length} Professional Certifications
• ${kb.achievements.length} Academic Achievements

He's passionate about technology and always eager to take on new challenges!`;
                }
            },
            {
                name: 'availability',
                patterns: [
                    'available', 'freelance', 'work together', 'collaboration', 'opportunity', 'is he free',
                    'is he available', 'can he work', 'free for work', 'hire', 'hiring', 'job opening',
                    'position', 'vacancy', 'looking for work', 'seeking opportunities', 'open to work',
                    'can i hire', 'how to hire', 'employment opportunities', 'work availability'
                ],
                handler: (kb) => {
                    return `Great news! Tariq is currently available for new opportunities:

✅ **Freelance Status:** ${kb.personal.freelance}
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
                patterns: [
                    'philosophy', 'work style', 'approach', 'how do you work', 'work ethic', 'principles',
                    'values', 'methodology', 'work principles', 'professional values', 'work mindset',
                    'how does he work', 'work approach', 'development approach', 'coding style'
                ],
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
                patterns: [
                    'more details', 'tell me more about', 'specifics', 'details', 'explain more', 'elaborate on',
                    'deep dive', 'in depth', 'specific information', 'technical details', 'implementation details',
                    'project specifics', 'how was it built', 'what technologies', 'architecture details'
                ],
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
                patterns: [
                    'who is', 'who are', 'who was', 'who were', 'who does', 'who do', 'who has', 'who have',
                    'who worked', 'who developed', 'who created', 'who built', 'who designed', 'who programmed'
                ],
                handler: (kb, message) => {
                    this.conversationMemory.questionHistory.push({ type: 'who', message });
                    return this.handleWhoQuestion(kb, message);
                }
            },

            {
                name: 'what_questions',
                patterns: [
                    'what is', 'what are', 'what was', 'what were', 'what does', 'what do', 'what has',
                    'what have', 'what can', 'what should', 'what kind of', 'what type of', 'what sort of'
                ],
                handler: (kb, message) => {
                    this.conversationMemory.questionHistory.push({ type: 'what', message });
                    return this.handleWhatQuestion(kb, message);
                }
            },

            {
                name: 'where_questions',
                patterns: [
                    'where is', 'where are', 'where was', 'where were', 'where does', 'where do', 'where from',
                    'location', 'where located', 'where based', 'where works', 'where studied'
                ],
                handler: (kb, message) => {
                    this.conversationMemory.questionHistory.push({ type: 'where', message });
                    return this.handleWhereQuestion(kb, message);
                }
            },

            {
                name: 'when_questions',
                patterns: [
                    'when is', 'when are', 'when was', 'when were', 'when does', 'when do', 'when did',
                    'when will', 'since when', 'how long', 'duration', 'time period', 'what year',
                    'what date', 'when started', 'when finished', 'when completed'
                ],
                handler: (kb, message) => {
                    this.conversationMemory.questionHistory.push({ type: 'when', message });
                    return this.handleWhenQuestion(kb, message);
                }
            },

            {
                name: 'how_questions',
                patterns: [
                    'how is', 'how are', 'how was', 'how were', 'how does', 'how do', 'how did', 'how will',
                    'how can', 'how to', 'how much', 'how many', 'how often', 'how well', 'how long'
                ],
                handler: (kb, message) => {
                    this.conversationMemory.questionHistory.push({ type: 'how', message });
                    return this.handleHowQuestion(kb, message);
                }
            },

            {
                name: 'why_questions',
                patterns: [
                    'why is', 'why are', 'why was', 'why were', 'why does', 'why do', 'why did', 'why will',
                    'why choose', 'why decided', 'why selected', 'reason for', 'motivation', 'purpose'
                ],
                handler: (kb, message) => {
                    this.conversationMemory.questionHistory.push({ type: 'why', message });
                    return this.handleWhyQuestion(kb, message);
                }
            },

            // Contextual Follow-ups
            {
                name: 'follow_up',
                patterns: [
                    'more', 'details', 'tell me more', 'explain', 'elaborate', 'expand', 'additional',
                    'further', 'continue', 'go on', 'keep going', 'tell me everything', 'full details'
                ],
                handler: (kb, message) => {
                    return this.handleFollowUp(kb, message);
                }
            },

            // Comparison and Preferences
            {
                name: 'comparison',
                patterns: [
                    'vs', 'versus', 'compare', 'comparison', 'better', 'best', 'prefer', 'favorite',
                    'strength', 'weakness', 'advantage', 'disadvantage', 'pros and cons', 'difference between'
                ],
                handler: (kb, message) => {
                    return this.handleComparison(kb, message);
                }
            },

            // Testimonials and Recommendations
            {
                name: 'testimonials',
                patterns: [
                    'testimonial', 'recommendation', 'review', 'feedback', 'said about', 'think of', 'opinion',
                    'what people say', 'references', 'endorsements', 'what others think', 'reputation'
                ],
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
                patterns: [
                    'certification', 'certificate', 'achievement', 'award', 'recognition', 'accomplishment',
                    'qualification', 'credentials', 'certified', 'professional development', 'training',
                    'courses completed', 'learning achievements', 'academic honors', 'distinctions'
                ],
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
                patterns: [
                    'social', 'linkedin', 'github', 'twitter', 'facebook', 'instagram', 'online', 'profile',
                    'portfolio', 'website', 'blog', 'digital presence', 'social networks', 'professional networks'
                ],
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
                patterns: [
                    'age', 'old', 'born', 'birthday', 'birth', 'young', 'years old', 'how old',
                    'what\'s his age', 'his age', 'what age', 'date of birth', 'when was he born'
                ],
                handler: (kb, message) => {
                    const birthYear = new Date(kb.personal.birthday).getFullYear();
                    const currentYear = new Date().getFullYear();
                    const age = currentYear - birthYear;

                    return `Tariq was born on ${kb.personal.birthday}, making him ${age} years old. He's a young and dynamic ${kb.personal.title} with a passion for technology and innovation. His fresh perspective combined with his academic background makes him particularly adept at modern development practices and emerging technologies.`;
                }
            },

            // Hobbies and Interests
            {
                name: 'interests',
                patterns: [
                    'hobby', 'interest', 'like', 'enjoy', 'passion', 'free time', 'outside work',
                    'personal interests', 'hobbies', 'recreation', 'leisure activities', 'what does he do for fun'
                ],
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
                patterns: [
                    'future', 'plan', 'goal', 'aspire', 'want to', 'looking forward', 'next', 'career goal',
                    'ambitions', 'objectives', 'targets', 'aspirations', 'what\'s next', 'future projects'
                ],
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

    // Enhanced Personality System Methods
    initializeResponseVariations() {
        return {
            greetings: {
                firstTime: {
                    morning: [
                        `Good morning! ☀️ I'm absolutely excited to introduce you to Tariq Ahmad's world of innovation! As his AI assistant, I've seen some incredible work that I'm eager to share.`,
                        `Rise and shine! 🌟 Welcome to Tariq's professional playground! His tech journey is nothing short of inspiring, and I'm your guide to exploring it.`,
                        `Top of the morning to you! ☕ Ready to dive into the fascinating universe of a Computer Engineer who's making waves in tech?`
                    ],
                    afternoon: [
                        `Good afternoon! 🚀 I'm buzzing with excitement to show you Tariq's impressive portfolio! His projects are seriously cool.`,
                        `Hello there! 💻 Perfect time to explore some amazing tech work! Tariq's journey in software development is quite remarkable.`,
                        `Greetings! ⚡ I'm thrilled to be your guide through Tariq's professional achievements. Prepare to be impressed!`
                    ],
                    evening: [
                        `Good evening! 🌙 Welcome! I'm delighted to share Tariq's tech adventures with you. His work is absolutely fascinating!`,
                        `Hello! ✨ What a perfect time to explore some innovative projects! Tariq's contributions to tech are truly inspiring.`,
                        `Evening greetings! 🌟 I'm excited to walk you through Tariq's professional journey. It's quite a story!`
                    ]
                },
                returning: {
                    morning: [
                        `Great to see you back! ☀️ Ready to continue exploring Tariq's tech universe? I've got more fascinating details to share!`,
                        `Welcome back! 🚀 I was hoping you'd return! There's so much more about Tariq's work that I think you'll find interesting.`,
                        `Hello again! ☕ Ready for another dive into innovation? Tariq's projects continue to evolve, and I've got fresh insights!`
                    ],
                    afternoon: [
                        `Welcome back, explorer! 💻 I'm excited to continue our journey through Tariq's tech achievements!`,
                        `Great to see you again! ⚡ Ready to discover more about Tariq's innovative work? I've got plenty to share!`,
                        `Hello again! 🌟 I'm thrilled to continue showing you around Tariq's professional portfolio!`
                    ],
                    evening: [
                        `Welcome back! 🌙 Perfect timing for more tech inspiration! Tariq's work never ceases to amaze me!`,
                        `Good to see you again! ✨ Ready to continue our exploration? Tariq's projects have some fascinating details!`,
                        `Evening greetings, return visitor! 🌟 I'm delighted to continue sharing Tariq's tech journey with you!`
                    ]
                }
            },
            skills: {
                enthusiastic: [
                    `Oh, you're asking about Tariq's skills? 🚀 This is where things get really exciting! His technical arsenal is seriously impressive!`,
                    `Skills discussion! 💻 Let me tell you, Tariq's tech stack is like a superhero's utility belt - incredibly versatile and powerful!`,
                    `Technical expertise! ⚡ Brace yourself, because Tariq's skill set is absolutely remarkable!`
                ],
                professional: [
                    `Tariq has developed a comprehensive technical skill set throughout his academic and professional journey.`,
                    `His technical expertise spans multiple domains, with particular strength in full-stack development.`,
                    `Let me provide you with a detailed overview of Tariq's technical capabilities and proficiencies.`
                ]
            },
            projects: {
                storytelling: [
                    `Let me tell you about one of Tariq's most exciting projects! 🎯 This is where his creativity really shines!`,
                    `Project time! 🚀 I love sharing these stories because they show how Tariq turns ideas into reality!`,
                    `Ah, projects! 💡 This is where the magic happens! Tariq's ability to solve real-world problems is incredible!`
                ],
                technical: [
                    `Regarding Tariq's project portfolio, here are the technical implementations and outcomes.`,
                    `Let me provide details about Tariq's project work, including technologies used and achievements.`,
                    `Here's information about Tariq's project experience and technical contributions.`
                ]
            },
            humor: {
                tech: [
                    `Tariq's debugging skills are so good, even bugs surrender voluntarily! 🐛✨`,
                    `His code is cleaner than a freshly formatted hard drive! 💫`,
                    `Tariq turns coffee into code... and occasionally, bugs into features! ☕🔄`,
                    `His Git commits are more organized than my binary thoughts! 🤖💭`
                ],
                light: [
                    `Prepare to be impressed! Tariq's work is seriously cool! 😎`,
                    `Warning: May cause sudden inspiration to start coding! ⚡`,
                    `Tariq's projects are like potato chips - you can't stop at just one! 🥔✨`
                ]
            }
        };
    }

    initializePersonalityExpressions() {
        return {
            enthusiastic: {
                adjectives: ['absolutely', 'incredibly', 'seriously', 'remarkably', 'genuinely', 'truly'],
                exclamations: ['🚀', '⚡', '✨', '💫', '🌟', '🎯'],
                phrases: [
                    'I\'m genuinely excited to share...',
                    'This is absolutely fascinating...',
                    'Prepare to be impressed...',
                    'What makes this special is...',
                    'I\'m particularly proud to show you...'
                ]
            },
            professional: {
                adjectives: ['comprehensive', 'extensive', 'proficient', 'skilled', 'experienced'],
                transitions: ['Furthermore', 'Additionally', 'Moreover', 'In addition'],
                phrases: [
                    'Let me provide you with...',
                    'I can share detailed insights about...',
                    'Here\'s comprehensive information regarding...',
                    'Allow me to explain...'
                ]
            },
            empathetic: {
                encouragements: [
                    'That\'s an excellent question!',
                    'You\'re asking all the right things!',
                    'Your curiosity shows great insight!',
                    'I appreciate your interest in...'
                ],
                support: [
                    'I\'m here to help you explore...',
                    'Let me guide you through...',
                    'I\'d be delighted to assist you with...',
                    'Feel free to ask me anything about...'
                ]
            }
        };
    }

    initializeContextualResponses() {
        return {
            followUpQuestions: {
                skills: [
                    'Are there any specific technologies you\'d like to dive deeper into?',
                    'Would you like to hear about how Tariq applies these skills in real projects?',
                    'Are you curious about his learning journey with these technologies?',
                    'Should I share some impressive projects that showcase these skills?'
                ],
                experience: [
                    'Would you like to know more about the challenges and achievements in these roles?',
                    'Are you interested in how these experiences connect to his current work?',
                    'Should I share some standout moments from his professional journey?',
                    'Would you like to hear about the skills he developed in each position?'
                ],
                projects: [
                    'Want to dive deeper into the technical implementation?',
                    'Are you curious about the challenges Tariq faced during development?',
                    'Should I share the outcomes and impact of these projects?',
                    'Would you like to hear about the learning moments and breakthroughs?'
                ]
            },
            contextualAdditions: {
                career: [
                    'His career journey is quite inspiring!',
                    'Each role has contributed uniquely to his growth.',
                    'His professional development shows remarkable progression.'
                ],
                learning: [
                    'Continuous learning is one of Tariq\'s core values!',
                    'He\'s always expanding his technical horizons.',
                    'His dedication to staying current is impressive.'
                ],
                innovation: [
                    'Innovation is at the heart of everything Tariq does!',
                    'His creative problem-solving is truly remarkable.',
                    'He approaches challenges with such ingenuity!'
                ]
            }
        };
    }

    // Enhanced greeting methods
    getFirstTimeGreetings(timeOfDay) {
        return this.responseVariations.greetings.firstTime[timeOfDay];
    }

    getReturningUserGreetings(timeOfDay) {
        return this.responseVariations.greetings.returning[timeOfDay];
    }

    getContextualGreetingAddition() {
        const hour = new Date().getHours();
        let contextualMessage = '';

        if (hour >= 9 && hour <= 17) {
            contextualMessage = ' Perfect time to explore some innovative work! 💼';
        } else if (hour >= 18 && hour <= 22) {
            contextualMessage = ' Evening is ideal for discovering inspiring projects! 🌟';
        } else {
            contextualMessage = ' Late-night coding inspiration? I\'ve got you covered! 🚀';
        }

        return contextualMessage;
    }

    // Personality enhancement methods
    addPersonalityToResponse(baseResponse, context) {
        let enhancedResponse = baseResponse;

        // Add enthusiasm based on context
        if (this.personality.traits.enthusiastic > 0.7) {
            const expressions = this.personalityExpressions.enthusiastic;
            const randomExclamation = this.getRandomResponse(expressions.exclamations);
            const randomPhrase = this.getRandomResponse(expressions.phrases);

            if (Math.random() > 0.5) {
                enhancedResponse = `${randomExclamation} ${enhancedResponse}`;
            }
        }

        // Add humor appropriately
        if (this.personality.traits.humor > 0.5 && Math.random() > 0.7) {
            const humorType = Math.random() > 0.5 ? 'tech' : 'light';
            const humorArray = this.responseVariations.humor[humorType];
            const randomHumor = this.getRandomResponse(humorArray);

            enhancedResponse += ` ${randomHumor}`;
        }

        return enhancedResponse;
    }

    updateUserInteraction(interactionType) {
        this.userProfile.totalInteractions++;
        this.personality.conversationDepth++;

        // Update engagement level
        if (this.personality.conversationDepth > 3) {
            this.personality.engagementLevel = Math.min(1.0, this.personality.engagementLevel + 0.1);
        }

        // Adjust personality based on interaction
        if (interactionType === 'technical') {
            this.personality.traits.techSavvy = Math.min(1.0, this.personality.traits.techSavvy + 0.1);
        }

        // Store visit information
        const now = new Date();
        if (!this.userProfile.lastVisit || this.isUserReturningVisitor(now)) {
            this.userProfile.visitCount++;
            this.userProfile.lastVisit = now;
        }
    }

    isUserReturningVisitor(currentTime) {
        if (!this.userProfile.lastVisit) return false;

        const timeDiff = currentTime - this.userProfile.lastVisit;
        const hoursDiff = timeDiff / (1000 * 60 * 60);

        return hoursDiff > 24; // Consider returning if more than 24 hours
    }

    /**
     * Initialize the assistant UI and event listeners
     */
    init() {
        this.createAssistantUI();
        this.attachEventListeners();
        this.showWelcomeMessage();

        // Set initial state based on viewport size
        const isMobileViewport = window.innerWidth < 768;

        if (isMobileViewport) {
            // On mobile, start with FAB visible and chat hidden
            this.elements.chatWidget.style.display = 'none';
            this.elements.chatFab.classList.remove('hidden');
            this.elements.chatFab.classList.add('visible');
        } else {
            // On desktop/laptop, show the FAB by default
            this.elements.chatWidget.style.display = 'none';
            this.elements.chatFab.classList.remove('hidden');
            this.elements.chatFab.classList.add('visible');
        }

        // Mark initialization as complete
        this.isInitialized = true;

        // Run initial section check after initialization is complete
        if (window.innerWidth < 768) {
            this.runInitialSectionCheck();
        }

        // Auto-show notification badge after a delay if FAB hasn't been clicked
        setTimeout(() => {
            if (!this.hasFabBeenClicked) {
                this.addNotification();
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
          <i class="ri-message-3-line"></i>
          <div class="notification-badge" id="notificationBadge">1</div>
        </button>
        
        <!-- Main Chat Widget -->
        <div class="chat-widget" id="chatWidget">
          <!-- Header -->
          <div class="chat-header" id="chatHeader">
            <div class="assistant-info">
              <div class="assistant-avatar">
                <i class="ri-message-3-line"></i>
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
              <i class="ri-message-3-line ai-icon"></i>
              <h3>Professional AI Assistant</h3>
              <p>Hello! I can tell you about Tariq's skills, experience, projects, and more. Just ask or select a quick question below!</p>
            </div>
          </div>
          
          <!-- Quick Actions -->
          <div class="quick-actions" id="quickActions">
            <div class="quick-actions-title">Quick questions:</div>
            <div class="quick-actions-list">
              <button class="quick-action" data-message="Skills">Skills</button>
              <button class="quick-action" data-message="Experience">Experience</button>
              <button class="quick-action" data-message="Projects">Projects</button>
              <button class="quick-action" data-message="Education">Education</button>
              <button class="quick-action" data-message="Contact">Contact</button>
            </div>
          </div>
          
          <!-- Typing Indicator -->
          <div class="typing-indicator" id="typingIndicator">
            <div class="assistant-info">
              <div class="assistant-avatar">
                <i class="ri-message-3-line"></i>
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
     * Show the chat widget with smooth animation
     */
    showChat() {
        // Mark that FAB has been clicked and hide notification
        this.hasFabBeenClicked = true;
        this.hideNotification();

        // Hide FAB with animation - remove visible class and add hidden class
        this.elements.chatFab.classList.remove('visible');
        this.elements.chatFab.classList.add('hidden');

        // Show chat widget with animation
        this.elements.chatWidget.style.display = 'flex';

        // Force a reflow to ensure the display change is applied before animation
        void this.elements.chatWidget.offsetWidth;

        // Add opening class for smooth animation
        this.elements.chatWidget.classList.remove('minimized', 'closing');
        this.elements.chatWidget.classList.add('opening');
        this.isMinimized = false;

        // Add mobile-specific adjustments
        if (window.innerWidth < 768) {
            this.adjustForMobile();
        }

        // Focus input after animation completes
        this.waitForTransition(this.elements.chatWidget).then(() => {
            this.elements.chatWidget.classList.remove('opening');
            this.focusInput();
        });
    }

    /**
     * Hide the chat widget with smooth animation
     */
    hideChat() {
        this.elements.chatWidget.classList.add('closing');
        this.isMinimized = true;

        // Wait for animation to complete before showing FAB
        this.waitForTransition(this.elements.chatWidget).then(() => {
            this.elements.chatWidget.style.display = 'none';
            this.elements.chatWidget.classList.remove('closing');
            // Show FAB with animation - remove hidden class and add visible class
            this.elements.chatFab.classList.remove('hidden');
            this.elements.chatFab.classList.add('visible');
        });
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
        this.waitForTransition(this.elements.chatWidget).then(() => {
            this.elements.chatWidget.style.display = 'none';
            // Show FAB with animation - remove hidden class and add visible class
            this.elements.chatFab.classList.remove('hidden');
            this.elements.chatFab.classList.add('visible');
        });
    }

    /**
     * Close the chat widget completely with smooth animation
     */
    closeChat() {
        this.elements.chatWidget.classList.add('closing');

        this.waitForTransition(this.elements.chatWidget).then(() => {
            this.elements.chatWidget.style.display = 'none';
            this.elements.chatWidget.classList.remove('closing');
            // Show FAB with animation - remove hidden class and add visible class
            this.elements.chatFab.classList.remove('hidden');
            this.elements.chatFab.classList.add('visible');
            this.isMinimized = true;
        });
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
                <i class="ri-message-3-line ai-icon"></i>
                <h3>Professional AI Assistant</h3>
                <p>Hello! I can tell you about Tariq's skills, experience, projects, and more. Just ask or select a quick question below!</p>
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
     * Focus the input field with optimized performance
     */
    focusInput() {
        requestAnimationFrame(() => {
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
        });
    }

    /**
     * Auto-resize input field with optimized performance
     */
    autoResizeInput() {
        requestAnimationFrame(() => {
            const input = this.elements.messageInput;
            if (!input) return;

            input.style.height = 'auto';
            const scrollHeight = input.scrollHeight;
            const maxHeight = 80; // Match CSS max-height
            input.style.height = Math.min(scrollHeight, maxHeight) + 'px';

            // Enable/disable scrolling based on content height
            input.style.overflowY = scrollHeight > maxHeight ? 'auto' : 'hidden';
        });
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
        this.elements.quickActions.style.display = 'none';

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
     * Add a message to the chat with optimized DOM manipulation
     */
    addMessage(sender, content) {
        const time = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
        const avatar = sender === 'assistant' ? '<i class="ri-message-3-line"></i>' : '<i class="ri-user-line"></i>';

        // Process content based on sender type
        const processedContent = sender === 'assistant' ? this.parseMarkdown(content) : this.escapeHtml(content);

        // Create message elements using documentFragment for better performance
        const fragment = document.createDocumentFragment();

        const messageElement = document.createElement('div');
        messageElement.className = `message ${sender}`;

        const avatarElement = document.createElement('div');
        avatarElement.className = 'message-avatar';
        avatarElement.innerHTML = avatar;

        const contentElement = document.createElement('div');
        contentElement.className = 'message-content';
        contentElement.innerHTML = processedContent;

        const timeElement = document.createElement('div');
        timeElement.className = 'message-time';
        timeElement.textContent = time;

        messageElement.appendChild(avatarElement);
        messageElement.appendChild(contentElement);

        fragment.appendChild(messageElement);
        fragment.appendChild(timeElement);

        // Remove welcome message if it exists
        const welcomeMessage = this.elements.chatMessages.querySelector('.welcome-message');
        if (welcomeMessage) {
            requestAnimationFrame(() => {
                welcomeMessage.remove();
            });
        }

        // Use requestAnimationFrame for smoother DOM insertion
        requestAnimationFrame(() => {
            this.elements.chatMessages.appendChild(fragment);
            this.scrollToBottom();
        });

        // Store in history
        this.messageHistory.push({ sender, content, time });
    }

    /**
     * Streams the response to the chat, simulating a typing effect with optimized performance
     * @param {string} text - The full response text to be streamed.
     */
    async streamResponse(text) {
        const time = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
        const avatar = '<i class="ri-message-3-line"></i>';

        // Create a message element but with empty content
        const messageId = `msg-${Date.now()}`;

        // Create elements using documentFragment for better performance
        const fragment = document.createDocumentFragment();

        const messageElement = document.createElement('div');
        messageElement.className = 'message assistant';
        messageElement.id = messageId;

        const avatarElement = document.createElement('div');
        avatarElement.className = 'message-avatar';
        avatarElement.innerHTML = avatar;

        const contentElement = document.createElement('div');
        contentElement.className = 'message-content';

        const timeElement = document.createElement('div');
        timeElement.className = 'message-time';
        timeElement.textContent = time;

        messageElement.appendChild(avatarElement);
        messageElement.appendChild(contentElement);

        fragment.appendChild(messageElement);
        fragment.appendChild(timeElement);

        const welcomeMessage = this.elements.chatMessages.querySelector('.welcome-message');
        if (welcomeMessage) {
            requestAnimationFrame(() => {
                welcomeMessage.remove();
            });
        }

        // Use requestAnimationFrame for smoother DOM insertion
        requestAnimationFrame(() => {
            this.elements.chatMessages.appendChild(fragment);
            this.scrollToBottom();
        });

        // Split text into words to make the streaming feel more natural
        const words = text.split(' ');
        let currentContent = '';
        let wordIndex = 0;

        // Use a more efficient streaming approach with requestAnimationFrame
        const streamWord = () => {
            if (wordIndex < words.length) {
                currentContent += words[wordIndex] + ' ';
                wordIndex++;

                // Update content in requestAnimationFrame for smoother rendering
                requestAnimationFrame(() => {
                    contentElement.innerHTML = this.parseMarkdown(currentContent);
                    this.scrollToBottom();
                });

                // Vary the delay to simulate a more human-like typing speed
                const delay = Math.random() * 50 + 20; // delay between 20ms and 70ms
                setTimeout(streamWord, delay);
            } else {
                // Final update to ensure everything is correct
                requestAnimationFrame(() => {
                    contentElement.innerHTML = this.parseMarkdown(text);
                    this.scrollToBottom();
                });

                this.messageHistory.push({ sender: 'assistant', content: text, time });
            }
        };

        // Start streaming
        streamWord();
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
     * Scroll chat to bottom with optimized performance
     */
    scrollToBottom() {
        // Use requestAnimationFrame for smoother scrolling
        requestAnimationFrame(() => {
            if (this.elements.chatMessages) {
                this.elements.chatMessages.scrollTop = this.elements.chatMessages.scrollHeight;
            }
        });
    }

    /**
     * Show welcome message
     */
    showWelcomeMessage() {
        // Welcome message is already in HTML
    }

    /**
     * Add a notification
     */
    addNotification() {
        this.notificationCount++;
        this.hasNotifications = true;
        this.updateNotificationBadge();
    }

    /**
     * Clear all notifications
     */
    clearNotifications() {
        this.notificationCount = 0;
        this.hasNotifications = false;
        this.updateNotificationBadge();
    }

    /**
     * Update notification badge content
     */
    updateNotificationBadge() {
        if (this.elements.notificationBadge) {
            this.elements.notificationBadge.textContent = this.notificationCount > 0 ?
                (this.notificationCount > 99 ? '99+' : this.notificationCount.toString()) : '';
        }
    }

    /**
     * Show notification badge with smooth animation
     */
    showNotification() {
        if (!this.hasFabBeenClicked && this.hasNotifications && this.elements.notificationBadge) {
            // Remove hidden class if present
            this.elements.notificationBadge.classList.remove('hidden');
            // Add visible class to trigger animation
            this.elements.notificationBadge.classList.add('visible');
        }
    }

    /**
     * Hide notification badge with smooth animation
     */
    hideNotification() {
        if (this.elements.notificationBadge) {
            // Add hidden class to trigger hide animation
            this.elements.notificationBadge.classList.add('hidden');
            // Remove visible class
            this.elements.notificationBadge.classList.remove('visible');

            // Clear notifications when badge is hidden
            this.clearNotifications();
        }
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
     * Enhanced specific technology handler with personality
     */
    handleSpecificTechnology(kb, tech) {
        this.updateUserInteraction('technical');
        this.userProfile.interests.add(tech);

        // Get relevant projects from knowledge base
        const relevantProjects = kb.projects.filter(project =>
            project.technologies.some(projectTech =>
                projectTech.toLowerCase().includes(tech.toLowerCase())
            )
        );

        // Get relevant experience from knowledge base
        const relevantExperience = kb.experience.filter(exp =>
            exp.responsibilities.some(resp =>
                resp.toLowerCase().includes(tech.toLowerCase())
            )
        );

        // Get relevant skills from knowledge base
        const relevantSkills = this.getRelevantSkills(kb, tech);

        // Build comprehensive response with knowledge base data
        const techResponses = {
            'python': {
                professional: this.buildProfessionalTechResponse(kb, tech, relevantProjects, relevantExperience, relevantSkills),
                enthusiastic: this.buildEnthusiasticTechResponse(kb, tech, relevantProjects, relevantExperience, relevantSkills),
                technical: this.buildTechnicalTechResponse(kb, tech, relevantProjects, relevantExperience, relevantSkills)
            },
            'java': {
                professional: this.buildProfessionalTechResponse(kb, tech, relevantProjects, relevantExperience, relevantSkills),
                enthusiastic: this.buildEnthusiasticTechResponse(kb, tech, relevantProjects, relevantExperience, relevantSkills),
                technical: this.buildTechnicalTechResponse(kb, tech, relevantProjects, relevantExperience, relevantSkills)
            },
            'javascript': {
                professional: this.buildProfessionalTechResponse(kb, tech, relevantProjects, relevantExperience, relevantSkills),
                enthusiastic: this.buildEnthusiasticTechResponse(kb, tech, relevantProjects, relevantExperience, relevantSkills),
                technical: this.buildTechnicalTechResponse(kb, tech, relevantProjects, relevantExperience, relevantSkills)
            },
            'react': {
                professional: this.buildProfessionalTechResponse(kb, tech, relevantProjects, relevantExperience, relevantSkills),
                enthusiastic: this.buildEnthusiasticTechResponse(kb, tech, relevantProjects, relevantExperience, relevantSkills),
                technical: this.buildTechnicalTechResponse(kb, tech, relevantProjects, relevantExperience, relevantSkills)
            },
            'django': {
                professional: this.buildProfessionalTechResponse(kb, tech, relevantProjects, relevantExperience, relevantSkills),
                enthusiastic: this.buildEnthusiasticTechResponse(kb, tech, relevantProjects, relevantExperience, relevantSkills),
                technical: this.buildTechnicalTechResponse(kb, tech, relevantProjects, relevantExperience, relevantSkills)
            },
            'mysql': {
                professional: this.buildProfessionalTechResponse(kb, tech, relevantProjects, relevantExperience, relevantSkills),
                enthusiastic: this.buildEnthusiasticTechResponse(kb, tech, relevantProjects, relevantExperience, relevantSkills),
                technical: this.buildTechnicalTechResponse(kb, tech, relevantProjects, relevantExperience, relevantSkills)
            },
            'mongodb': {
                professional: this.buildProfessionalTechResponse(kb, tech, relevantProjects, relevantExperience, relevantSkills),
                enthusiastic: this.buildEnthusiasticTechResponse(kb, tech, relevantProjects, relevantExperience, relevantSkills),
                technical: this.buildTechnicalTechResponse(kb, tech, relevantProjects, relevantExperience, relevantSkills)
            },
            'docker': {
                professional: this.buildProfessionalTechResponse(kb, tech, relevantProjects, relevantExperience, relevantSkills),
                enthusiastic: this.buildEnthusiasticTechResponse(kb, tech, relevantProjects, relevantExperience, relevantSkills),
                technical: this.buildTechnicalTechResponse(kb, tech, relevantProjects, relevantExperience, relevantSkills)
            },
            'git': {
                professional: this.buildProfessionalTechResponse(kb, tech, relevantProjects, relevantExperience, relevantSkills),
                enthusiastic: this.buildEnthusiasticTechResponse(kb, tech, relevantProjects, relevantExperience, relevantSkills),
                technical: this.buildTechnicalTechResponse(kb, tech, relevantProjects, relevantExperience, relevantSkills)
            },
            'ai': {
                professional: this.buildProfessionalTechResponse(kb, tech, relevantProjects, relevantExperience, relevantSkills),
                enthusiastic: this.buildEnthusiasticTechResponse(kb, tech, relevantProjects, relevantExperience, relevantSkills),
                technical: this.buildTechnicalTechResponse(kb, tech, relevantProjects, relevantExperience, relevantSkills)
            }
        };

        const userStyle = this.determineUserResponseStyle();
        const responseSet = techResponses[tech];

        if (responseSet && responseSet[userStyle]) {
            return responseSet[userStyle];
        }

        return techResponses[tech]?.professional || this.buildGenericTechResponse(kb, tech, relevantProjects, relevantExperience, relevantSkills);
    }

    /**
     * Get relevant skills for a technology
     */
    getRelevantSkills(kb, tech) {
        const techSkillMap = {
            'python': ['Python', 'Django', 'Flask', 'FastAPI'],
            'java': ['Java', 'Spring Boot', 'Maven', 'Gradle'],
            'javascript': ['JavaScript', 'React', 'Node.js', 'Express'],
            'react': ['React', 'React Native', 'Hooks', 'Context'],
            'django': ['Django', 'Python', 'ORM', 'Middleware'],
            'mysql': ['MySQL', 'SQL', 'Database Design', 'Query Optimization'],
            'mongodb': ['MongoDB', 'NoSQL', 'Document Modeling', 'Aggregation'],
            'docker': ['Docker', 'Containerization', 'DevOps', 'CI/CD'],
            'git': ['Git', 'Version Control', 'GitHub', 'Collaboration'],
            'ai': ['AI', 'Machine Learning', 'TensorFlow', 'Neural Networks']
        };

        return techSkillMap[tech] || [];
    }

    /**
     * Build professional technology response with knowledge base data
     */
    buildProfessionalTechResponse(kb, tech, projects, experience, skills) {
        let response = `Tariq has extensive ${tech} experience, particularly with ${skills.join(', ')}. `;

        if (projects.length > 0) {
            response += `He's applied this in ${projects.length} projects, including ${projects.slice(0, 2).map(p => p.name).join(', ')}. `;
        }

        if (experience.length > 0) {
            response += `His experience includes ${experience.length} roles where ${tech} was utilized, such as ${experience.slice(0, 2).map(e => e.title).join(', ')}. `;
        }

        response += `His ${tech} expertise covers ${skills.slice(0, 3).join(', ')}.`;

        return response;
    }

    /**
     * Build enthusiastic technology response with knowledge base data
     */
    buildEnthusiasticTechResponse(kb, tech, projects, experience, skills) {
        const techEmojis = {
            'python': '🐍',
            'java': '☕',
            'javascript': '🚀',
            'react': '⚛️',
            'django': '🎸',
            'mysql': '🗄️',
            'mongodb': '🍃',
            'docker': '🐳',
            'git': '📚',
            'ai': '🤖'
        };

        const emoji = techEmojis[tech] || '💻';

        let response = `${emoji} Oh, ${tech}! This is where Tariq truly shines! His ${skills.join(', ')} skills are absolutely incredible. `;

        if (projects.length > 0) {
            response += `He's built ${projects.length} amazing projects with ${tech}, including ${projects.slice(0, 2).map(p => p.name).join(', ')} that showcase his brilliance! `;
        }

        if (experience.length > 0) {
            response += `His ${experience.length} professional roles demonstrate his ${tech} mastery, especially ${experience.slice(0, 2).map(e => e.title).join(', ')}! `;
        }

        response += `From web development to machine learning, his ${tech} work is seriously impressive!`;

        return response;
    }

    /**
     * Build technical technology response with knowledge base data
     */
    buildTechnicalTechResponse(kb, tech, projects, experience, skills) {
        let response = `Tariq's ${tech} expertise spans multiple areas:`;

        if (skills.length > 0) {
            response += `\n\n**Core Skills:**\n${skills.slice(0, 4).map(skill => `• ${skill}`).join('\n')}`;
        }

        if (projects.length > 0) {
            response += `\n\n**Project Implementations:**\n`;
            projects.slice(0, 3).forEach(project => {
                response += `• ${project.name}: ${project.technologies.join(', ')}\n`;
            });
        }

        if (experience.length > 0) {
            response += `\n\n**Professional Applications:**\n`;
            experience.slice(0, 2).forEach(exp => {
                response += `• ${exp.title} at ${exp.company}: Applied ${tech} for ${exp.responsibilities.slice(0, 2).join(', ')}\n`;
            });
        }

        response += `\n\n**Technical Highlights:**\n`;
        response += `• Modern ${tech} development practices and patterns\n`;
        response += `• Integration with complementary technologies\n`;
        response += `• Performance optimization and security considerations`;

        return response;
    }

    /**
     * Build generic technology response with knowledge base data
     */
    buildGenericTechResponse(kb, tech, projects, experience, skills) {
        let response = `Tariq has experience with ${tech} and has applied it in various projects. `;

        if (projects.length > 0) {
            response += `He's worked on ${projects.length} projects using ${tech}, including ${projects.slice(0, 2).map(p => p.name).join(', ')}. `;
        }

        if (experience.length > 0) {
            response += `His experience includes ${experience.length} roles where ${tech} was utilized. `;
        }

        response += `Would you like to see specific examples of his work with ${tech}?`;

        return response;
    }

    /**
     * Determine appropriate response style based on user interaction
     */
    determineUserResponseStyle() {
        if (this.personality.engagementLevel > 0.6) {
            return 'enthusiastic';
        } else {
            return 'professional';
        }
    }

    /**
     * Get enthusiastic skills response
     */
    getEnthusiasticSkillsResponse(kb) {
        return `🚀 Oh, skills discussion! This is where things get seriously exciting! Tariq's technical arsenal is like a superhero's utility belt - absolutely incredible and incredibly versatile!

**Programming Languages:** ${kb.skills.languages.join(', ')} ⚡
*Each language is like a different superpower in his coding arsenal!*

**Frameworks & Libraries:** ${kb.skills.frameworks.join(', ')} 🛠️
*These frameworks let him build anything from simple websites to complex enterprise systems!*

**Databases:** ${kb.skills.databases.join(', ')} 🗄️
*He can organize data like a digital librarian on steroids!*

**Tools & Technologies:** ${kb.skills.tools.join(', ')} 🛠️
*Modern tools that make development smooth and efficient!*

**Networking:** ${kb.skills.networking.join(', ')} 🌐
*Connecting systems and making them talk to each other!*

**Operating Systems:** ${kb.skills.os.join(', ')} 💻
*Comfortable across different computing environments!*

**Markup Languages:** ${kb.skills.markup.join(', ')} 🌐
*Building beautiful and responsive web interfaces!*

His full-stack development skills with Python/Django and Java/Spring Boot are absolutely remarkable! 🎯 He can build entire applications from scratch - frontend, backend, database, everything! It's like watching a master craftsman at work!`;
    }


    /**
     * Get professional skills response
     */
    getProfessionalSkillsResponse(kb) {
        return `Tariq has developed comprehensive technical expertise across multiple areas:

**Programming Languages:** ${kb.skills.languages.join(', ')}
*Solid foundation in modern programming languages with practical application experience*

**Frameworks & Libraries:** ${kb.skills.frameworks.join(', ')}
*Proficient in contemporary frameworks for building scalable and maintainable applications*

**Databases:** ${kb.skills.databases.join(', ')}
*Experience with both relational and non-relational database systems for diverse data needs*

**Tools & Technologies:** ${kb.skills.tools.join(', ')}
*Familiar with modern development tools and best practices*

**Networking:** ${kb.skills.networking.join(', ')}
*Understanding of network protocols and system connectivity*

**Operating Systems:** ${kb.skills.os.join(', ')}
*Cross-platform development capabilities*

**Markup Languages:** ${kb.skills.markup.join(', ')}
*Building beautiful and responsive web interfaces*

**Soft Skills:** ${kb.skills.softSkills.join(', ')}
*Essential interpersonal and professional capabilities*

He demonstrates particular strength in full-stack development with Python/Django and Java/Spring Boot, combining frontend and backend expertise effectively.`;
    }

    /**
     * Handle specific experience questions with enhanced personality
     */
    handleSpecificExperience(kb, company, role) {
        if (company) {
            const experience = kb.experience.find(exp => exp.company.toLowerCase().includes(company.toLowerCase()));
            if (experience) {
                const personalityIntro = this.getPersonalityExperienceIntro(experience);
                return `${personalityIntro}

**${experience.title}** at ${experience.company}
📅 ${experience.duration}
📍 ${experience.location || 'Remote'}

**Key Responsibilities:**
${experience.responsibilities.map(resp => `• ${resp}`).join('\n')}

${this.getExperienceImpact(experience)}`;
            }
        }

        if (role) {
            const experience = kb.experience.find(exp => exp.title.toLowerCase().includes(role.toLowerCase()));
            if (experience) {
                const personalityIntro = this.getPersonalityExperienceIntro(experience);
                return `${personalityIntro}

Regarding his role as **${experience.title}** at ${experience.company}:

📅 ${experience.duration}
📍 ${experience.location || 'Remote'}

**Key Achievements:**
${experience.responsibilities.map(resp => `• ${resp}`).join('\n')}

${this.getExperienceImpact(experience)}`;
            }
        }

        return "I'd be absolutely delighted to tell you more about specific roles or companies! Tariq's professional journey is quite fascinating. Could you be more specific about which experience you'd like to know about?";
    }

    /**
     * Get personality-infused introduction for experience
     */
    getPersonalityExperienceIntro(experience) {
        const intros = {
            'researcher': "🔬 Oh, research experience! This is where Tariq's innovative spirit truly shines!",
            'developer': "💻 Development experience! This is where Tariq turns ideas into reality!",
            'intern': "🚀 Internship experience! This is where Tariq built his foundation and learned from the best!",
            'technician': "🔧 Technical experience! This is where Tariq developed his problem-solving mindset!"
        };

        const roleKey = Object.keys(intros).find(key => experience.title.toLowerCase().includes(key));
        return roleKey ? intros[roleKey] : "💼 Professional experience! Here's where Tariq made his mark!";
    }

    /**
     * Get impact statement for experience
     */
    getExperienceImpact(experience) {
        const userStyle = this.determineUserResponseStyle();

        if (userStyle === 'enthusiastic') {
            return `This role was absolutely transformative for Tariq! He developed incredible expertise in ${experience.responsibilities.slice(0, 2).join(' and ').toLowerCase()}, and the experience shaped his approach to technology and innovation! 🌟`;
        } else if (userStyle === 'technical') {
            return `This position provided Tariq with valuable technical exposure to ${experience.responsibilities.slice(0, 2).join(' and ').toLowerCase()}, contributing to his comprehensive understanding of software engineering principles and research methodologies.`;
        } else {
            return `This role allowed Tariq to develop expertise in ${experience.responsibilities.slice(0, 2).join(' and ').toLowerCase()}. The experience contributed significantly to his professional growth and technical capabilities.`;
        }
    }

    /**
     * Handle specific project questions with enhanced personality
     */
    handleSpecificProject(kb, project) {
        if (!project) return "I'd absolutely love to tell you about a specific project! Tariq's work is seriously impressive! Which one catches your interest?";

        const personalityIntro = this.getProjectPersonalityIntro(project);

        let response = `${personalityIntro}

**${project.name}** 🚀

*Technologies Used:* ${project.technologies.join(', ')} ⚡

${project.description}

**Key Features & Outcomes:**
${project.details.map(detail => `• ${detail}`).join('\n')}`;

        const projectImpact = this.getProjectImpact(project);
        response += `\n\n${projectImpact}`;

        if (project.liveDemo) response += `\n\n🌐 [View Live Demo](${project.liveDemo}) - See it in action!`;
        if (project.github) response += `\n📚 [View Source Code](${project.github}) - Explore the implementation!`;

        return response;
    }

    /**
     * Get personality-infused introduction for projects
     */
    getProjectPersonalityIntro(project) {
        const techTypes = {
            'django': '🎸 Django project alert! This is where Tariq\'s Python wizardry really shines!',
            'react': '⚛️ React project! Get ready for some beautiful, interactive user interfaces!',
            'java': '☕ Java project time! Enterprise-level development at its finest!',
            'mobile': '📱 Mobile app project! Tariq\'s cross-platform skills on full display!',
            'database': '🗄️ Database-focused project! Watch Tariq organize data like a pro!',
            'ai': '🤖 AI/ML project! This is where Tariq explores the cutting edge!'
        };

        const lowerTech = project.technologies.join(' ').toLowerCase();
        const techKey = Object.keys(techTypes).find(key => lowerTech.includes(key));
        return techKey ? techTypes[techKey] : "🚀 Project showcase! This is where Tariq\'s creativity meets technical excellence!";
    }

    /**
     * Get impact statement for projects
     */
    getProjectImpact(project) {
        const userStyle = this.determineUserResponseStyle();

        if (userStyle === 'enthusiastic') {
            return `This project is absolutely brilliant! It showcases Tariq's ability to turn complex requirements into elegant solutions. The way he combines ${project.technologies.slice(0, 2).join(' and ')} is seriously impressive! ✨`;
        } else if (userStyle === 'technical') {
            return `This project demonstrates solid engineering principles with ${project.technologies.slice(0, 2).join(' and ')}. The implementation showcases attention to scalability, maintainability, and modern development practices.`;
        } else {
            return `This project reflects Tariq's commitment to quality and innovation. His use of ${project.technologies.slice(0, 2).join(' and ')} demonstrates his versatility and technical competence.`;
        }
    }

    /**
     * Handle projects filtered by technology with personality
     */
    handleProjectsByTechnology(kb, tech) {
        const relevantProjects = kb.projects.filter(project =>
            project.technologies.some(projectTech =>
                projectTech.toLowerCase().includes(tech.toLowerCase())
            )
        );

        if (relevantProjects.length === 0) {
            const userStyle = this.determineUserResponseStyle();
            if (userStyle === 'enthusiastic') {
                return `🤔 While Tariq hasn't worked on any projects specifically using ${tech} yet, he's absolutely familiar with the technology and super eager to apply it in future projects! His learning agility is remarkable! Would you like to see his work in related technologies?`;
            } else if (userStyle === 'technical') {
                return `Tariq hasn't implemented projects specifically using ${tech}, but he maintains familiarity with the technology stack and is prepared to apply it when project requirements align. Would you like to explore his work in related technologies?`;
            } else {
                return `Tariq hasn't worked on any projects specifically using ${tech}, but he's familiar with the technology and eager to apply it in future projects. Would you like to see his work in related technologies?`;
            }
        }

        const personalityIntro = this.getTechProjectIntro(tech);
        let response = `${personalityIntro}\n\n`;

        relevantProjects.forEach((project, index) => {
            response += `**${index + 1}. ${project.name}** 🚀\n`;
            response += `*Technologies: ${project.technologies.join(', ')}*\n`;
            response += `${project.description}\n\n`;
        });

        const techInsight = this.getTechInsight(tech, relevantProjects);
        response += `${techInsight}`;

        return response;
    }

    /**
     * Get personality-infused introduction for technology projects
     */
    getTechProjectIntro(tech) {
        const techIntros = {
            'python': '🐍 Python projects! Get ready to see some elegant and powerful code!',
            'java': '☕ Java projects! Enterprise-level development at its finest!',
            'react': '⚛️ React projects! Beautiful, interactive user interfaces ahead!',
            'django': '🎸 Django projects! Full-stack web development magic!',
            'mysql': '🗄️ MySQL projects! Watch how Tariq organizes data beautifully!',
            'mongodb': '🍃 MongoDB projects! Flexible NoSQL database implementations!',
            'javascript': '🚀 JavaScript projects! The language of the web in action!'
        };

        return techIntros[tech.toLowerCase()] || `🚀 ${tech} projects! Here's where Tariq applies this technology!`;
    }

    /**
     * Get technology insight based on projects
     */
    getTechInsight(tech, projects) {
        const userStyle = this.determineUserResponseStyle();

        if (userStyle === 'enthusiastic') {
            return `Tariq's work with ${tech} is absolutely impressive! He's created ${projects.length} amazing projects that showcase his versatility and technical prowess. Each project demonstrates his ability to solve real-world problems with elegant solutions! ✨`;
        } else if (userStyle === 'technical') {
            return `These ${projects.length} projects demonstrate Tariq's proficiency with ${tech}, showcasing his understanding of best practices, architectural patterns, and effective implementation strategies.`;
        } else {
            return `These ${projects.length} projects highlight Tariq's experience with ${tech} and his ability to deliver practical solutions using this technology.`;
        }
    }

    /**
     * Get enthusiastic experience response
     */
    getEnthusiasticExperienceResponse(kb) {
        const currentRole = kb.experience[0];
        const previousRoles = kb.experience.slice(1).map(exp => `• ${exp.title} at ${exp.company} ${this.getRoleEmoji(exp.title)}`).join('\n');

        return `🚀 Oh, Tariq's professional journey is absolutely inspiring! His career path shows incredible growth and diverse experiences:

**Current Role:** ${currentRole.title} at ${currentRole.company} 🏭
*He's working on cutting-edge technology that's shaping the future!*

**Previous Experience:**
${previousRoles}

**What's amazing:** Each role has built upon the previous one, creating a perfect blend of technical expertise, research skills, and practical problem-solving abilities! His journey from network fundamentals to advanced research is absolutely remarkable! 🌟`;
    }


    /**
     * Get professional experience response
     */
    getProfessionalExperienceResponse(kb) {
        const currentRole = kb.experience[0];
        const previousRoles = kb.experience.slice(1).map(exp => `• ${exp.title} at ${exp.company}`).join('\n');

        return `Tariq has gained valuable professional experience across multiple roles:

**Current Position:** ${currentRole.title}
${currentRole.company}, ${currentRole.location}
Focus on cutting-edge technology research and implementation

**Previous Roles:**
${previousRoles}

**Professional Development:** Each position has contributed to his growth in technical expertise, research capabilities, and industry knowledge, preparing him for advanced challenges in technology development.`;
    }

    /**
     * Get enthusiastic projects response
     */
    getEnthusiasticProjectsResponse(kb) {
        const featuredProjects = kb.projects.slice(0, 5);
        const projectList = featuredProjects.map(project => `• **${project.name}** - ${project.description.split('.')[0]}!`).join('\n');

        return `🚀 Oh, Tariq's projects are absolutely fantastic! His creativity and technical skills combine to create some truly impressive applications:

**Featured Projects:**
${projectList}

**What's incredible:** Each project solves real-world problems with elegant solutions! Tariq doesn't just code - he creates applications that make a genuine difference! His attention to detail and user experience is absolutely remarkable! ✨`;
    }


    /**
     * Get professional projects response
     */
    getProfessionalProjectsResponse(kb) {
        const webApps = kb.projects.filter(p => p.technologies.includes('HTML') || p.technologies.includes('Django') || p.technologies.includes('Java'));
        const mobileApps = kb.projects.filter(p => p.technologies.includes('React Native'));
        const researchProjects = kb.projects.filter(p => p.technologies.includes('Neural Networks') || p.technologies.includes('TensorFlow'));

        return `Tariq has completed ${kb.stats.projects} diverse projects showcasing his technical expertise:

**Web Applications:**
${webApps.slice(0, 3).map(p => `- ${p.name} - ${p.technologies.join(', ')}`).join('\n')}

**Mobile Applications:**
${mobileApps.map(p => `- ${p.name} - ${p.technologies.join(', ')}`).join('\n')}

**Research Projects:**
${researchProjects.map(p => `- ${p.name} - ${p.technologies.join(', ')}`).join('\n')}

Each project demonstrates practical application of technical skills, problem-solving abilities, and attention to user requirements and system design principles.`;
    }

    /**
     * Handle Who questions intelligently
     */
    handleWhoQuestion(kb, message) {
        const lowerMessage = message.toLowerCase();

        if (lowerMessage.includes('tariq') && (lowerMessage.includes('is') || lowerMessage.includes('are'))) {
            const birthYear = new Date(kb.personal.birthday).getFullYear();
            const age = new Date().getFullYear() - birthYear;
            return `Tariq Ahmad is a talented ${kb.personal.title} based in ${kb.personal.location}. He's a ${age}-year-old graduate from ${kb.personal.university} with a passion for full-stack development and research in Industry 4.0 technologies. Currently working as a ${kb.experience[0].title}, he's known for his expertise in Python/Django, Java/Spring Boot, and modern web technologies.`;
        }

        if (lowerMessage.includes('work') || lowerMessage.includes('company')) {
            const currentRole = kb.experience[0];
            const previousRoles = kb.experience.slice(1).map(exp => `${exp.title} at ${exp.company}`).join(', ');
            return `Tariq currently works as a ${currentRole.title} at ${currentRole.company} in ${currentRole.location}. He's also worked at ${previousRoles}.`;
        }

        if (lowerMessage.includes('recommend') || lowerMessage.includes('supervisor') || lowerMessage.includes('professor')) {
            const testimonials = kb.testimonials.slice(0, 3).map(t => `${t.author} (${t.position})`).join(', ');
            return `Several professors and colleagues have provided testimonials for Tariq. ${testimonials} are among those who have praised his work and dedication.`;
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
            return `Tariq studied Computer Engineering at ${kb.personal.university}, graduating in ${kb.personal.graduationYear} with a CGPA of ${kb.personal.cgpa}. His studies focused on software engineering, data structures, algorithms, and computer systems.`;
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
            const currentRole = kb.experience[0];
            const previousCompanies = kb.experience.slice(1).map(exp => exp.company).join(', ');
            return `Tariq works at ${currentRole.company} in ${currentRole.location}. He has also worked at ${previousCompanies}, all located in ${kb.personal.location}.`;
        }

        if (lowerMessage.includes('study') || lowerMessage.includes('university') || lowerMessage.includes('school')) {
            return `Tariq studied at ${kb.personal.university} in ${kb.personal.location}. He completed his Computer Engineering degree there, gaining both theoretical knowledge and practical experience in software development.`;
        }

        return `Tariq is based in ${kb.personal.location}, specifically Istanbul, Turkey. This vibrant city provides him with excellent opportunities in the tech industry and access to international collaborations.`;
    }

    /**
     * Handle When questions intelligently
     */
    handleWhenQuestion(kb, message) {
        const lowerMessage = message.toLowerCase();

        if (lowerMessage.includes('graduate') || lowerMessage.includes('finish') || lowerMessage.includes('complete')) {
            return `Tariq graduated from ${kb.personal.university} in ${kb.personal.graduationYear.split('-')[1]} with a ${kb.personal.degree} degree in Computer Engineering. He achieved a CGPA of ${kb.personal.cgpa} in his studies.`;
        }

        if (lowerMessage.includes('start') && lowerMessage.includes('work')) {
            const firstJob = kb.experience[kb.experience.length - 1]; // Last entry is first job
            return `Tariq started his professional career in ${firstJob.duration.split(' – ')[0]}. He began with a ${firstJob.title} role at ${firstJob.company}, then moved to research and development roles at other companies.`;
        }

        if (lowerMessage.includes('born') || lowerMessage.includes('birthday')) {
            const birthYear = new Date(kb.personal.birthday).getFullYear();
            const age = new Date().getFullYear() - birthYear;
            return `Tariq was born on ${kb.personal.birthday}, making him ${age} years old. He's a young professional bringing fresh perspectives to software development and research.`;
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
            const firstJob = kb.experience[kb.experience.length - 1];
            const startDate = firstJob.duration.split(' – ')[0];
            const months = Math.floor((new Date() - new Date(`${startDate} 1`)) / (1000 * 60 * 60 * 24 * 30));
            return `Tariq has been building professional experience since ${startDate}, accumulating about ${months} months in the industry. His experience spans network administration, frontend development, research assistance, and engineering research.`;
        }

        if (lowerMessage.includes('contact') || lowerMessage.includes('reach')) {
            return this.intentHandlers.find(h => h.name === 'contact').handler(kb, message);
        }

        if (lowerMessage.includes('work') || lowerMessage.includes('approach')) {
            return this.intentHandlers.find(h => h.name === 'philosophy').handler(kb, message);
        }

        if (lowerMessage.includes('old') || lowerMessage.includes('age')) {
            const birthYear = new Date(kb.personal.birthday).getFullYear();
            const age = new Date().getFullYear() - birthYear;
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
• ${kb.projects.filter(p => p.technologies.includes('Django')).length} Django/Python web applications
• ${kb.projects.filter(p => p.technologies.includes('React Native')).length} React Native mobile apps
• ${kb.projects.filter(p => p.technologies.includes('MySQL') || p.technologies.includes('MongoDB')).length} database-driven systems
• ${kb.projects.filter(p => p.technologies.includes('Neural Networks')).length} research implementations
• ${kb.projects.length} real-world problem-solving applications

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
     * Enhanced intelligent fallback with typo tolerance and fuzzy matching
     */
    handleIntelligentFallback(kb, message) {
        const lowerMessage = message.toLowerCase();
        this.updateUserInteraction('general');

        // Enhanced typo correction for common words
        const correctedMessage = this.correctCommonTypos(lowerMessage);

        // Enhanced personality-based greeting detection with typo tolerance
        const greetingPatterns = ['hello', 'hi', 'hey', 'greetings', 'good morning', 'good afternoon', 'good evening'];
        if (this.fuzzyMatch(correctedMessage, greetingPatterns, 0.8)) {
            this.personality.currentMood = 'enthusiastic';
            const enthusiasticGreetings = [
                "🚀 Oh, hello there! I'm absolutely excited to connect with you! Ready to explore Tariq's amazing tech world?",
                "⚡ Hey! Great to meet you! I'm buzzing with excitement to share Tariq's incredible journey with you!",
                "✨ Hi there! I'm delighted you stopped by! Tariq's work is absolutely fascinating, and I'm your guide to discovering it!"
            ];
            return this.getRandomResponse(enthusiasticGreetings) + "\n\nWhat aspect of Tariq's professional expertise interests you most?";
        }

        // Handle short conversational words with typo tolerance
        const conversationalWords = ['so', 'ok', 'okay', 'hmm', 'hmmm', 'ah', 'oh', 'well'];
        if (conversationalWords.includes(correctedMessage) || conversationalWords.some(word => correctedMessage.includes(word))) {
            const continuationResponses = [
                "🤔 I sense you're thinking! What would you like to know about Tariq's skills, experience, or projects?",
                "💭 Ready to dive deeper into Tariq's professional journey? I can share details about his education, work, or achievements!",
                "🎯 What catches your interest? Tariq's technical skills, his project portfolio, or his career background?"
            ];
            return this.getRandomResponse(continuationResponses);
        }

        // Enhanced intent detection with fuzzy matching
        const intentKeywords = {
            'availability': ['hire', 'job', 'opportunity', 'work together', 'collaborate', 'freelance'],
            'pricing': ['price', 'cost', 'rate', 'charge', 'fee', 'payment'],
            'help': ['help', 'assist', 'support', 'guidance', 'information'],
            'gratitude': ['thank', 'thanks', 'appreciate', 'grateful'],
            'wellbeing': ['how are you', 'how do you do', 'how are things'],
            'personal': ['your favorite', 'what do you think', 'you like', 'your opinion']
        };

        for (const [intent, keywords] of Object.entries(intentKeywords)) {
            if (this.fuzzyMatch(correctedMessage, keywords, 0.7)) {
                switch (intent) {
                    case 'availability':
                        return this.intentHandlers.find(h => h.name === 'availability').handler(kb, message);
                    case 'pricing':
                        return this.handlePricingInquiry();
                    case 'help':
                        return this.handleHelpRequest();
                    case 'gratitude':
                        return this.handleGratitudeResponse();
                    case 'wellbeing':
                        return this.handleWellbeingResponse();
                    case 'personal':
                        return this.handlePersonalInquiry();
                }
            }
        }

        // Check for entities mentioned in the message
        const mentionedEntities = this.extractEntities(message);
        if (mentionedEntities.length > 0) {
            return this.handleEntityMentions(kb, mentionedEntities, message);
        }

        // Enhanced generic responses with contextual suggestions
        return this.generateContextualFallback(kb, correctedMessage);
    }

    /**
     * Correct common typos in user messages
     */
    correctCommonTypos(message) {
        const typoCorrections = {
            'skil': 'skill',
            'skils': 'skills',
            'tehnology': 'technology',
            'tehnologies': 'technologies',
            'porject': 'project',
            'porjects': 'projects',
            'experiance': 'experience',
            'experiance': 'experience',
            'educaton': 'education',
            'universiy': 'university',
            'contct': 'contact',
            'contat': 'contact',
            'avaliable': 'available',
            'freelance': 'freelance',
            'freelncer': 'freelancer',
            'programing': 'programming',
            'developement': 'development',
            'framwork': 'framework',
            'framwork': 'framework',
            'data base': 'database',
            'data bases': 'databases',
            'javascrpt': 'javascript',
            'pyton': 'python',
            'jav': 'java',
            'reactjs': 'react',
            'react js': 'react',
            'springboot': 'spring boot',
            'spring boot': 'spring boot',
            'git hub': 'github',
            'linkdin': 'linkedin',
            'twiter': 'twitter',
            'facebok': 'facebook',
            'instgram': 'instagram'
        };

        let correctedMessage = message;
        for (const [typo, correction] of Object.entries(typoCorrections)) {
            const regex = new RegExp(typo, 'gi');
            correctedMessage = correctedMessage.replace(regex, correction);
        }

        return correctedMessage;
    }

    /**
     * Fuzzy matching function for typo tolerance
     */
    fuzzyMatch(text, patterns, threshold = 0.7) {
        for (const pattern of patterns) {
            const similarity = this.calculateSimilarity(text, pattern);
            if (similarity >= threshold) {
                return true;
            }
            // Also check if pattern is contained within text or vice versa
            if (text.includes(pattern) || pattern.includes(text)) {
                return true;
            }
        }
        return false;
    }

    /**
     * Calculate similarity between two strings using Levenshtein distance
     */
    calculateSimilarity(str1, str2) {
        const longer = str1.length > str2.length ? str1 : str2;
        const shorter = str1.length > str2.length ? str2 : str1;

        if (longer.length === 0) return 1.0;

        const levenshteinDistance = this.calculateLevenshteinDistance(longer, shorter);
        return (longer.length - levenshteinDistance) / longer.length;
    }

    /**
     * Calculate Levenshtein distance between two strings
     */
    calculateLevenshteinDistance(str1, str2) {
        const matrix = [];

        for (let i = 0; i <= str2.length; i++) {
            matrix[i] = [i];
        }

        for (let j = 0; j <= str1.length; j++) {
            matrix[0][j] = j;
        }

        for (let i = 1; i <= str2.length; i++) {
            for (let j = 1; j <= str1.length; j++) {
                if (str2.charAt(i - 1) === str1.charAt(j - 1)) {
                    matrix[i][j] = matrix[i - 1][j - 1];
                } else {
                    matrix[i][j] = Math.min(
                        matrix[i - 1][j - 1] + 1,
                        matrix[i][j - 1] + 1,
                        matrix[i - 1][j] + 1
                    );
                }
            }
        }

        return matrix[str2.length][str1.length];
    }

    /**
     * Handle pricing inquiries with personality
     */
    handlePricingInquiry() {
        const personalityResponses = [
            "💰 Regarding rates and pricing, Tariq believes in fair value exchange! His compensation is project-based and depends on complexity, timeline, and requirements. He's open to discussing how his expertise can bring value to your project. Feel free to reach out directly - he loves talking about potential collaborations!",
            "💼 Tariq's approach to pricing is all about value alignment! Each project is unique, so he customizes his rates based on scope and impact. He's happy to discuss your specific needs and find a arrangement that works for both sides. Let's connect!"
        ];
        return this.getRandomResponse(personalityResponses);
    }

    /**
     * Handle help requests with contextual suggestions
     */
    handleHelpRequest() {
        const contextualHelp = this.getContextualHelpSuggestions();
        return `🤝 I'm absolutely here to help! I'm Tariq's enthusiastic AI assistant, and I'd love to guide you through his professional world! I can share insights about:\n\n${contextualHelp}\n\nWhat sparks your curiosity the most?`;
    }

    /**
     * Handle gratitude responses with personality
     */
    handleGratitudeResponse() {
        const gratitudeResponses = [
            "😊 You're so welcome! I'm absolutely thrilled I could help you discover Tariq's amazing work! He's genuinely passionate about technology, and it shows in everything he creates. Feel free to ask me anything else - I love sharing his journey!",
            "🌟 My pleasure! I'm delighted I could assist you in learning about Tariq! His dedication to technology and innovation is truly inspiring. If you have more questions or want to dive deeper into any topic, I'm always here and excited to help!",
            "✨ Absolutely wonderful! I'm so glad I could help you explore Tariq's professional world! He's building some incredible things in tech, and I love being able to share his story. Don't hesitate to ask if you want to know more!"
        ];
        return this.getRandomResponse(gratitudeResponses);
    }

    /**
     * Handle wellbeing inquiries
     */
    handleWellbeingResponse() {
        const moodResponses = [
            "⚡ I'm absolutely fantastic! Thanks for asking! I'm always excited when people want to learn about Tariq's incredible work in technology. His projects and skills never fail to amaze me! What would you like to explore first?",
            "🚀 I'm doing wonderfully! I'm buzzing with excitement to share Tariq's tech journey with you! His full-stack development skills and research work are absolutely remarkable. Ready to dive in?",
            "✨ I'm absolutely delighted! I love connecting with people who are interested in technology and innovation! Tariq's work in AI, web development, and research is seriously impressive. What catches your interest?"
        ];
        return this.getRandomResponse(moodResponses);
    }

    /**
     * Handle personal inquiries
     */
    handlePersonalInquiry() {
        return `🤖 That's such a thoughtful question! As Tariq's AI assistant, I'm absolutely fascinated by his work in Industry 4.0 and full-stack development! His Airport Management System and BudgetWise mobile app are particularly impressive - the way he combines technical excellence with practical solutions is brilliant!\n\nBut I'm most excited about sharing his journey with curious minds like yours! What aspect of his work interests you most?`;
    }

    /**
     * Generate contextual fallback responses with knowledge base hints
     */
    generateContextualFallback(kb, message) {
        const userStyle = this.determineUserResponseStyle();
        let helpfulResponses;

        // Try to extract any partial intent from the message
        const partialIntent = this.extractPartialIntent(message);

        if (partialIntent) {
            return this.handlePartialIntent(kb, partialIntent, message);
        }

        if (userStyle === 'enthusiastic') {
            helpfulResponses = [
                "🚀 Oh, I'm absolutely excited to help you discover Tariq's world! His tech journey is seriously impressive, and I've got so many fascinating details to share! What sparks your curiosity the most?",
                "⚡ I'm absolutely thrilled to be your guide! Tariq's work in technology is nothing short of amazing! From full-stack development to cutting-edge research, there's so much to explore! Where should we start?",
                "✨ I'm absolutely delighted to connect with you! Tariq's professional journey is filled with incredible achievements and innovative projects! I'm excited to share everything - what interests you most?"
            ];
        } else if (userStyle === 'technical') {
            helpfulResponses = [
                "I can provide comprehensive technical insights about Tariq's expertise. His proficiency spans Python/Django, Java/Spring Boot, React, and database technologies. Would you like detailed information about his technical skills, project implementations, or architectural approaches?",
                "From a technical perspective, Tariq's portfolio demonstrates strong engineering capabilities across multiple domains. I can share details about his system design patterns, development methodologies, or specific technology implementations. What technical aspects interest you?",
                "I can offer detailed technical analysis of Tariq's work, including his full-stack development experience, research implementations, and technology stack choices. His projects showcase solid software engineering principles and modern development practices. What technical areas would you like to explore?"
            ];
        } else {
            helpfulResponses = [
                "I'd be delighted to help you learn more about Tariq Ahmad! I'm his AI assistant and can provide detailed information about his skills, experience, projects, and background. What specific aspect interests you?",
                "I'm here to share insights about Tariq's professional journey. Whether you're interested in his technical expertise, project portfolio, or career achievements, I can provide comprehensive information. What would you like to explore?",
                "Tariq is a skilled Computer Engineer with expertise in full-stack development and research. I can tell you about his programming skills, professional experience, notable projects, or how to get in touch. What would you like to know?"
            ];
        }

        const baseResponse = this.getRandomResponse(helpfulResponses);
        const personalityEnhanced = this.addPersonalityToResponse(baseResponse, 'fallback');

        // Add contextual suggestions based on knowledge base
        const suggestions = this.generateContextualSuggestions(kb, message);

        return `${personalityEnhanced}\n\n${suggestions}`;
    }

    /**
     * Extract partial intent from message
     */
    extractPartialIntent(message) {
        const intentKeywords = {
            'skills': ['skill', 'tech', 'programming', 'code', 'language', 'framework'],
            'experience': ['work', 'job', 'career', 'company', 'role', 'position'],
            'projects': ['project', 'app', 'build', 'create', 'develop', 'portfolio'],
            'education': ['study', 'university', 'degree', 'college', 'academic'],
            'contact': ['contact', 'email', 'phone', 'reach', 'connect']
        };

        for (const [intent, keywords] of Object.entries(intentKeywords)) {
            if (keywords.some(keyword => message.includes(keyword))) {
                return intent;
            }
        }

        return null;
    }

    /**
     * Handle partial intents with contextual responses
     */
    handlePartialIntent(kb, intent, message) {
        const suggestions = {
            'skills': "I can tell you about Tariq's technical skills! He's proficient in Python, Java, JavaScript, and works with frameworks like Django, Spring Boot, and React. Would you like to know more about his programming languages, frameworks, or tools?",
            'experience': "I can share details about Tariq's professional experience! He's worked as a Researcher Intern at Industrial 4.0 Research Center and has experience in frontend development. Are you interested in his current role or previous positions?",
            'projects': "Tariq has worked on some impressive projects! Including a Quizlet platform, BudgetWise expense tracker, and various management systems. Would you like to hear about his web applications, mobile apps, or research projects?",
            'education': "I can tell you about Tariq's educational background! He studied Computer Engineering at Istanbul Aydin University. Would you like to know about his degree, certifications, or academic achievements?",
            'contact': "I can help you get in touch with Tariq! He's available for freelance projects and new opportunities. Would you like his contact information or professional profiles?"
        };

        const baseResponse = suggestions[intent] || "I'd be happy to help you learn more about Tariq! What specific aspect interests you?";
        const personalityEnhanced = this.addPersonalityToResponse(baseResponse, 'partial_intent');

        return personalityEnhanced;
    }

    /**
     * Generate contextual suggestions based on message and knowledge base
     */
    generateContextualSuggestions(kb, message) {
        const suggestions = [
            "💡 **Try asking about:**",
            "• \"What are Tariq's main programming skills?\"",
            "• \"Tell me about his experience\"",
            "• \"Show me some of his projects\"",
            "• \"How can I contact Tariq?\"",
            "• \"What's his educational background?\""
        ];

        // Add personalized suggestions based on message content
        if (message.includes('code') || message.includes('program')) {
            suggestions.push("• \"What programming languages does he know?\"");
            suggestions.push("• \"Show me projects with specific technologies\"");
        }

        if (message.includes('work') || message.includes('job')) {
            suggestions.push("• \"Where has Tariq worked?\"");
            suggestions.push("• \"What is his current position?\"");
        }

        return suggestions.join('\n');
    }

    /**
     * Get contextual help suggestions based on user profile and conversation
     */
    getContextualHelpSuggestions() {
        const suggestions = [
            "🎯 **Technical Skills:** Programming languages, frameworks, databases, and tools",
            "💼 **Professional Experience:** Career journey, roles, and achievements",
            "🚀 **Projects & Portfolio:** Web apps, mobile apps, and research implementations",
            "🎓 **Education & Certifications:** Academic background and professional development",
            "📞 **Contact & Availability:** How to connect and collaborate"
        ];

        // Add personalized suggestions based on user interests
        if (this.userProfile.interests.has('technical_skills')) {
            suggestions.push("⚡ **Deep Dive:** Advanced technical concepts and architecture patterns");
        }

        if (this.userProfile.interests.has('projects')) {
            suggestions.push("🌟 **Project Insights:** Development stories and technical challenges");
        }

        return suggestions.join('\n');
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
     * Enhanced AI response generation with natural conversation flow
     */
    async generateResponse(message) {
        // Simulate thinking time with variation based on conversation complexity
        const baseThinkingTime = 800 + Math.random() * 1200;
        const complexityBonus = Math.min(this.personality.conversationDepth * 100, 500);
        await new Promise(resolve => setTimeout(resolve, baseThinkingTime + complexityBonus));

        // Update conversation context with more sophisticated analysis
        const normalizedMessage = message.toLowerCase();
        this.updateConversationContext(normalizedMessage);

        // Update conversation memory with rich metadata
        this.updateConversationMemory(normalizedMessage, message);

        // Analyze user interaction patterns
        this.analyzeUserInteraction(message);

        // Enhanced intent matching with prioritization
        const matchedIntent = this.findBestIntentMatch(normalizedMessage);

        let response;
        if (matchedIntent) {
            try {
                // Generate response with context awareness
                response = this.generateContextualResponse(matchedIntent, message);

                // Post-process response for natural conversation flow
                response = this.enhanceResponseForNaturalFlow(response, matchedIntent);

                // Update conversation memory with response context
                this.updateConversationMemoryResponse(response, matchedIntent);

                return response;
            } catch (error) {
                console.error('Intent handler error:', error);
                return this.handleIntelligentFallback(this.knowledgeBase, message);
            }
        }

        // If no intent matched, use intelligent fallback with enhanced context
        return this.handleIntelligentFallback(this.knowledgeBase, message);
    }

    /**
     * Update conversation context with sophisticated analysis
     */
    updateConversationContext(message) {
        this.conversationContext.push(message);
        if (this.conversationContext.length > 10) {
            this.conversationContext = this.conversationContext.slice(-10);
        }

        // Analyze conversation patterns
        if (this.conversationContext.length > 2) {
            const recentMessages = this.conversationContext.slice(-3);
            const questionRatio = recentMessages.filter(msg =>
                msg.includes('?') || msg.includes('what') || msg.includes('how') || msg.includes('why')
            ).length / recentMessages.length;

            // Adjust personality based on conversation patterns
            if (questionRatio > 0.7) {
                this.personality.currentMood = 'helpful';
            }
        }
    }

    /**
     * Update conversation memory with rich metadata
     */
    updateConversationMemory(normalizedMessage, originalMessage) {
        this.conversationMemory.questionHistory.push({
            message: normalizedMessage,
            originalMessage: originalMessage,
            timestamp: new Date(),
            entities: this.extractEntities(originalMessage),
            sentiment: this.analyzeSentiment(originalMessage),
            complexity: this.analyzeComplexity(originalMessage)
        });

        if (this.conversationMemory.questionHistory.length > 5) {
            this.conversationMemory.questionHistory = this.conversationMemory.questionHistory.slice(-5);
        }
    }

    /**
     * Analyze user interaction patterns
     */
    analyzeUserInteraction(message) {
        // Update interaction metrics
        this.userProfile.totalInteractions++;
        this.personality.conversationDepth++;

        // Analyze message characteristics
        const messageLength = message.length;
        const hasQuestion = message.includes('?');
        const hasTechnicalTerms = this.extractTechnology(message) !== 'technology';

        // Adjust user profile based on interaction
        if (hasTechnicalTerms) {
            this.userProfile.technicalLevel = Math.min(
                this.userProfile.technicalLevel + 0.1,
                1.0
            );
        }

        if (messageLength > 50) {
            this.userProfile.communicationStyle = 'detailed';
        } else if (messageLength < 20) {
            this.userProfile.communicationStyle = 'concise';
        }

        // Update engagement level
        if (this.personality.conversationDepth > 3) {
            this.personality.engagementLevel = Math.min(
                this.personality.engagementLevel + 0.1,
                1.0
            );
        }
    }

    /**
     * Generate contextual response with enhanced personality
     */
    generateContextualResponse(matchedIntent, message) {
        // Get base response from intent handler
        let response = matchedIntent.handler(this.knowledgeBase, message);

        // Add contextual references if available
        if (this.conversationMemory.questionHistory.length > 1) {
            const previousQuestion = this.conversationMemory.questionHistory[
                this.conversationMemory.questionHistory.length - 2
            ];

            // Add contextual references for follow-up questions
            if (this.isFollowUpQuestion(message, previousQuestion.message)) {
                response = this.addContextualReference(response, previousQuestion);
            }
        }

        return response;
    }

    /**
     * Enhance response for natural conversation flow
     */
    enhanceResponseForNaturalFlow(response, intent) {
        // Add conversation flow elements based on context
        const flowEnhancers = {
            'skills': [
                "Here's what you should know about Tariq's skills:",
                "I'd be happy to share details about Tariq's technical expertise:",
                "Let me walk you through Tariq's skill set:"
            ],
            'experience': [
                "Regarding Tariq's professional background:",
                "Here's what I can tell you about Tariq's experience:",
                "Let me share some insights about Tariq's career journey:"
            ],
            'projects': [
                "I'm excited to show you Tariq's project work:",
                "Here are some details about Tariq's projects:",
                "Let me tell you about some of Tariq's impressive implementations:"
            ]
        };

        const userStyle = this.determineUserResponseStyle();

        // Only add flow enhancers for certain response types and contexts
        if (flowEnhancers[intent.name] && this.personality.conversationDepth === 1) {
            const enhancer = this.getRandomResponse(flowEnhancers[intent.name]);
            response = enhancer + "\n\n" + response;
        }

        // Add natural transitions for follow-up conversations
        if (this.personality.conversationDepth > 2) {
            const transitions = [
                "Building on our conversation,",
                "To expand on what we've been discussing,",
                "Continuing from where we left off,",
                "Adding to our discussion,"
            ];

            if (Math.random() > 0.5) {
                const transition = this.getRandomResponse(transitions);
                response = transition + " " + response.charAt(0).toLowerCase() + response.slice(1);
            }
        }

        return response;
    }

    /**
     * Check if current message is a follow-up to previous question
     */
    isFollowUpQuestion(currentMessage, previousQuestion) {
        const followUpIndicators = [
            'more', 'tell me more', 'explain', 'elaborate', 'expand',
            'continue', 'go on', 'details', 'specific'
        ];

        return followUpIndicators.some(indicator =>
            currentMessage.includes(indicator) ||
            (currentMessage.length < 15 && previousQuestion.entities && previousQuestion.entities.length > 0)
        );
    }

    /**
     * Add contextual reference to response
     */
    addContextualReference(response, previousQuestion) {
        if (previousQuestion.entities && previousQuestion.entities.length > 0) {
            const referencePhrases = [
                "Regarding what we were discussing about {entity},",
                "Building on our conversation about {entity},",
                "To expand on what you asked about {entity},",
                "Continuing our discussion about {entity},"
            ];

            const primaryEntity = previousQuestion.entities[0];
            const phrase = this.getRandomResponse(referencePhrases)
                .replace('{entity}', primaryEntity.value);

            return phrase + " " + response.charAt(0).toLowerCase() + response.slice(1);
        }

        return response;
    }

    /**
     * Analyze sentiment of message (simplified version)
     */
    analyzeSentiment(message) {
        const positiveWords = ['good', 'great', 'excellent', 'amazing', 'impressive', 'fantastic', 'love', 'like', 'wonderful'];
        const negativeWords = ['bad', 'terrible', 'awful', 'hate', 'dislike', 'poor', 'worst', 'horrible'];

        const lowerMessage = message.toLowerCase();
        const positiveCount = positiveWords.filter(word => lowerMessage.includes(word)).length;
        const negativeCount = negativeWords.filter(word => lowerMessage.includes(word)).length;

        if (positiveCount > negativeCount) return 'positive';
        if (negativeCount > positiveCount) return 'negative';
        return 'neutral';
    }

    /**
     * Analyze complexity of message
     */
    analyzeComplexity(message) {
        const wordCount = message.split(/\s+/).length;
        const sentenceCount = message.split(/[.!?]+/).length;
        const avgWordsPerSentence = wordCount / Math.max(sentenceCount, 1);

        if (avgWordsPerSentence > 15) return 'complex';
        if (avgWordsPerSentence > 8) return 'moderate';
        return 'simple';
    }

    /**
     * Update conversation memory with response context
     */
    updateConversationMemoryResponse(response, intent) {
        if (this.conversationMemory.questionHistory.length > 0) {
            const lastQuestion = this.conversationMemory.questionHistory[
                this.conversationMemory.questionHistory.length - 1
            ];
            lastQuestion.response = {
                content: response,
                intent: intent.name,
                timestamp: new Date(),
                length: response.length
            };
        }
    }

    /**
     * Enhanced intent matching with fuzzy matching and scoring
     */
    findBestIntentMatch(message) {
        let bestMatch = null;
        let bestScore = 0;

        // Apply typo correction before intent matching
        const correctedMessage = this.correctCommonTypos(message.toLowerCase());

        for (const intent of this.intentHandlers) {
            const score = this.calculateIntentScore(correctedMessage, intent);

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
     * Calculate how well an intent matches the message with fuzzy matching
     */
    calculateIntentScore(message, intent) {
        let score = 0;
        const lowerMessage = message.toLowerCase();
        const messageWords = lowerMessage.split(/\s+/).filter(word => word.length > 0);

        // Check exact pattern matches
        for (const pattern of intent.patterns) {
            const lowerPattern = pattern.toLowerCase();

            // Exact match
            if (lowerMessage.includes(lowerPattern)) {
                score += 1;

                // Bonus for exact word matches
                if (pattern.includes(' ')) {
                    score += 0.5; // Multi-word patterns get bonus
                }
            }
            // Fuzzy match for single-word patterns
            else if (!pattern.includes(' ')) {
                const similarity = this.calculateSimilarity(lowerMessage, lowerPattern);
                if (similarity > 0.8) {
                    score += 0.8 * similarity; // Weighted fuzzy match
                }
            }
        }

        // Word-level fuzzy matching
        for (const word of messageWords) {
            for (const pattern of intent.patterns) {
                const patternWords = pattern.toLowerCase().split(/\s+/).filter(w => w.length > 0);

                for (const patternWord of patternWords) {
                    const similarity = this.calculateSimilarity(word, patternWord);
                    if (similarity > 0.85) {
                        score += 0.3 * similarity; // Word-level fuzzy match
                    }
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

    /**
     * Get emoji for role based on title
     */
    getRoleEmoji(title) {
        const roleEmojis = {
            'Researcher': '🔬',
            'Developer': '💻',
            'Technician': '🔧',
            'Engineer': '⚙️',
            'Intern': '🚀'
        };

        for (const [role, emoji] of Object.entries(roleEmojis)) {
            if (title.includes(role)) {
                return emoji;
            }
        }
        return '💼';
    }

    /**
     * Helper method to wait for CSS transition to complete
     * @param {Element} element - The element to watch for transition
     * @returns {Promise} - Promise that resolves when transition completes
     */
    waitForTransition(element) {
        return new Promise(resolve => {
            if (!element) {
                resolve();
                return;
            }

            const duration = getComputedStyle(element).transitionDuration;
            const durationMs = parseFloat(duration) * 1000;

            // If no transition is set, resolve immediately
            if (durationMs === 0) {
                resolve();
                return;
            }

            const handleTransitionEnd = (e) => {
                if (e.target === element) {
                    element.removeEventListener('transitionend', handleTransitionEnd);
                    resolve();
                }
            };

            element.addEventListener('transitionend', handleTransitionEnd);

            // Fallback timeout in case transitionend doesn't fire
            setTimeout(() => {
                element.removeEventListener('transitionend', handleTransitionEnd);
                resolve();
            }, durationMs + 50);
        });
    }

    /**
     * Adjust chat widget for mobile devices
     */
    adjustForMobile() {
        const isMobile = window.innerWidth < 768;
        const isTablet = window.innerWidth >= 768 && window.innerWidth <= 1024;

        if (isMobile) {
            // Adjust chat widget height based on viewport
            const viewportHeight = window.innerHeight;
            const maxHeight = Math.min(viewportHeight * 0.8, 600);
            this.elements.chatWidget.style.maxHeight = `${maxHeight}px`;

            // Adjust position for better mobile experience
            this.elements.chatWidget.style.bottom = '1rem';

            // Add touch-friendly interactions
            this.addTouchInteractions();
        } else if (isTablet) {
            // Tablet-specific adjustments
            const viewportHeight = window.innerHeight;
            const maxHeight = Math.min(viewportHeight * 0.7, 500);
            this.elements.chatWidget.style.maxHeight = `${maxHeight}px`;
        }
    }

    /**
     * Add touch-friendly interactions for mobile devices
     */
    addTouchInteractions() {
        if (!this.touchInteractionsAdded) {
            // Add touch feedback to buttons
            const buttons = this.elements.chatWidget.querySelectorAll('button');
            buttons.forEach(button => {
                button.addEventListener('touchstart', () => {
                    button.style.transform = 'scale(0.95)';
                }, { passive: true });

                button.addEventListener('touchend', () => {
                    button.style.transform = 'scale(1)';
                }, { passive: true });
            });

            // Enhanced swipe gesture detection
            let startY = 0;
            let currentY = 0;
            let startX = 0;
            let isScrolling = false;
            let isSwipeGesture = false;
            let scrollStartTime = 0;
            let touchTarget = null;
            let initialScrollTop = 0;

            this.elements.chatWidget.addEventListener('touchstart', (e) => {
                const touch = e.touches[0];
                startY = touch.clientY;
                currentY = startY;
                startX = touch.clientX;
                isScrolling = false;
                isSwipeGesture = false;
                scrollStartTime = Date.now();
                touchTarget = e.target;
                
                // Get initial scroll position of messages area
                const messagesArea = this.elements.chatMessages;
                initialScrollTop = messagesArea ? messagesArea.scrollTop : 0;
                
                // Show swipe indicator if touching header or input area
                const isOnHeader = touchTarget.closest('.chat-header');
                const isOnInput = touchTarget.closest('.chat-input');
                if (isOnHeader || isOnInput) {
                    this.elements.chatWidget.classList.add('swipe-indicator');
                }
            }, { passive: true });

            this.elements.chatWidget.addEventListener('touchmove', (e) => {
                const touch = e.touches[0];
                currentY = touch.clientY;
                const currentX = touch.clientX;
                const deltaY = currentY - startY;
                const deltaX = currentX - startX;
                const deltaTime = Date.now() - scrollStartTime;
                
                // Calculate velocity
                const velocityY = Math.abs(deltaY) / deltaTime;
                
                // Check if touch is on scrollable messages area
                const isOnMessages = touchTarget.closest('.chat-messages');
                const messagesArea = this.elements.chatMessages;
                const currentScrollTop = messagesArea ? messagesArea.scrollTop : 0;
                const hasScrollableContent = messagesArea && messagesArea.scrollHeight > messagesArea.clientHeight;
                const isAtTop = currentScrollTop <= 0;
                const isAtBottom = messagesArea && currentScrollTop >= (messagesArea.scrollHeight - messagesArea.clientHeight - 5);
                
                // Determine if this is a scroll gesture
                // - Vertical movement is dominant
                // - Fast movement or on scrollable area
                // - Not a purely horizontal swipe
                if (Math.abs(deltaY) > Math.abs(deltaX) && (velocityY > 0.3 || isOnMessages)) {
                    isScrolling = true;
                }
                
                // Detect swipe gesture for closing (only when not scrolling and on header/input area)
                const isOnHeader = touchTarget.closest('.chat-header');
                const isOnInput = touchTarget.closest('.chat-input');
                const isOnSwipeArea = isOnHeader || isOnInput;
                
                if (!isScrolling && isOnSwipeArea && deltaY > 30 && Math.abs(deltaX) < 50) {
                    isSwipeGesture = true;
                    
                    // Apply visual feedback
                    const progress = Math.min(deltaY / 150, 1);
                    this.elements.chatWidget.style.transform = `translateY(${progress * 80}px) scale(${1 - progress * 0.05})`;
                    this.elements.chatWidget.style.opacity = 1 - progress * 0.3;
                    this.elements.chatWidget.style.transition = 'none';
                    
                    // Hide swipe indicator when swipe starts
                    this.elements.chatWidget.classList.remove('swipe-indicator');
                }
            }, { passive: true });

            this.elements.chatWidget.addEventListener('touchend', () => {
                const deltaY = currentY - startY;
                const deltaX = Math.abs((currentY ? startY : 0) - startX);
                const deltaTime = Date.now() - scrollStartTime;
                const velocityY = Math.abs(deltaY) / deltaTime;

                // Reset transition
                this.elements.chatWidget.style.transition = '';

                // Hide swipe indicator
                this.elements.chatWidget.classList.remove('swipe-indicator');

                // Close chat only if:
                // 1. It was detected as a swipe gesture (not scrolling)
                // 2. Swipe was primarily vertical
                // 3. Swipe distance was sufficient
                // 4. Velocity was reasonable (not too fast like scrolling)
                // 5. Touch was on header or input area
                if (isSwipeGesture &&
                    deltaY > 80 &&
                    deltaX < 100 &&
                    velocityY < 1.5 &&
                    deltaTime > 150) {
                    this.minimizeChat();
                } else {
                    // Reset position with animation
                    this.elements.chatWidget.style.transform = '';
                    this.elements.chatWidget.style.opacity = '';
                }

                // Reset all variables
                startY = 0;
                currentY = 0;
                startX = 0;
                isScrolling = false;
                isSwipeGesture = false;
                touchTarget = null;
                initialScrollTop = 0;
            }, { passive: true });

            // Also hide indicator when touch is cancelled
            this.elements.chatWidget.addEventListener('touchcancel', () => {
                this.elements.chatWidget.classList.remove('swipe-indicator');
                this.elements.chatWidget.style.transition = '';
                this.elements.chatWidget.style.transform = '';
                this.elements.chatWidget.style.opacity = '';
                
                // Reset all variables
                startY = 0;
                currentY = 0;
                startX = 0;
                isScrolling = false;
                isSwipeGesture = false;
                touchTarget = null;
                initialScrollTop = 0;
            }, { passive: true });

            this.touchInteractionsAdded = true;
        }
    }

    /**
     * Set up resize listener to handle viewport changes
     */
    setupResizeListener() {
        let resizeTimeout;

        const handleResize = () => {
            // Debounce resize events
            clearTimeout(resizeTimeout);
            resizeTimeout = setTimeout(() => {
                // Only handle resize after initialization is complete
                if (!this.isInitialized) {
                    return;
                }

                const isSmallPhone = window.innerWidth < 480;
                const isIPad = window.innerWidth >= 768 && window.innerWidth <= 1024;
                const isLargePhone = window.innerWidth >= 480 && window.innerWidth < 768;

                // Update FAB position: ONLY center on small phones (< 480px)
                if (isSmallPhone) {
                    this.elements.chatFab.style.left = '50%';
                    this.elements.chatFab.style.right = 'auto';
                    this.elements.chatFab.style.transform = 'translateX(-50%)';
                }
                // iPad and large phones use fixed right position (like desktop)
                else if (isIPad || isLargePhone || window.innerWidth > 1024) {
                    this.elements.chatFab.style.left = 'auto';
                    this.elements.chatFab.style.right = '1.5rem';
                    this.elements.chatFab.style.transform = 'translateX(0)';
                }

                // Adjust chat widget for new viewport size if it's open
                if (!this.isMinimized && this.elements.chatWidget.style.display === 'flex') {
                    this.adjustForMobile();
                }
            }, 100);
        };

        window.addEventListener('resize', handleResize, { passive: true });
    }

    /**
     * Run initial section check after initialization is complete
     */
    runInitialSectionCheck() {
        // Use a small delay to ensure all elements are properly rendered
        setTimeout(() => {
            const currentSection = this.getCurrentSection();
            const shouldHide = currentSection !== 'header' && currentSection !== 'home';

            if (this.elements && this.elements.assistant) {
                if (shouldHide) {
                    this.elements.assistant.classList.add('hidden');
                } else {
                    this.elements.assistant.classList.remove('hidden');
                }
            }
        }, 100);
    }

}

// Initialize the AI Assistant when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    // Wait a bit to ensure all other scripts are loaded
    setTimeout(() => {
        window.aiAssistant = new AIAssistant();
    }, 1000);
});
