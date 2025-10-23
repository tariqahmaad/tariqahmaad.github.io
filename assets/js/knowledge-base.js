/**
 * AI Assistant Knowledge Base
 * This file contains all the portfolio data for the AI assistant.
 * Version: 20251023
 */

// Debug: Log when knowledge base is loaded
console.log('📚 Knowledge Base Loading:', {
    timestamp: new Date().toISOString(),
    version: '20251023',
    file: 'knowledge-base.js'
});

export const knowledgeBase = {
    personal: {
        name: "Tariq Ahmad",
        title: "Computer Engineer",
        location: "Istanbul, Turkey",
        email: "tariq_muzamil@live.com",
        phone: "+90 534 540 3345",
        birthday: "10 June 2000",
        degree: "Bachelor's (Completed)",
        university: "Istanbul Aydin University",
        cgpa: "3.36/4.0",
        graduationYear: "2021-2025",
        linkedin: "https://www.linkedin.com/in/tariq-ahmad-a43320264",
        github: "https://github.com/tariqahmaad",
        twitter: "https://x.com/arrick007",
        facebook: "https://www.facebook.com/tariq.ahmaaad",
        instagram: "https://www.instagram.com/0xtahmad/",
        freelance: "Available"
    },

    skills: {
        languages: ["C", "C++", "C#", "Java", "Python", "JavaScript", "PHP"],
        frameworks: ["Django (Python)", "Spring Boot (Java)", "React (JavaScript)", "Bootstrap (CSS/JavaScript)"],
        databases: ["MySQL", "MongoDB", "PostgreSQL", "SQLite"],
        tools: ["Git", "Docker", "VS Code", "Photoshop"],
        networking: ["CCNA", "TCP/IP", "LAN/WAN"],
        os: ["Windows", "Linux", "MacOS"],
        markup: ["HTML", "CSS"],
        softSkills: ["Teamwork", "Communication", "Problem Solving", "Time Management"]
    },

    experience: [
        {
            title: "Researcher Intern",
            company: "Industrial 4.0 Research Center",
            location: "Istanbul, Turkey",
            duration: "Oct 2024 - Jul 2025",
            responsibilities: [
                "Systematic Literature Reviews",
                "Mixed Methods Data Analysis",
                "Experimental Design & Prototyping",
                "Technical Writing & Presentations",
                "Analytical Problem-Solving"
            ]
        },
        {
            title: "Engineering Researcher Intern",
            company: "Industrial 4.0 Research Center",
            location: "Istanbul, Turkey",
            duration: "March 2024 - June 2024",
            responsibilities: [
                "Literature Review",
                "Data Collection & Analysis",
                "Experimentations & Prototyping Collaboration",
                "Report Writing and Presentation",
                "Problem Solving"
            ]
        },
        {
            title: "Frontend Developer (Angular) Intern",
            company: "Caretta Software Company",
            location: "Istanbul, Turkey",
            duration: "Nov 2023 - Jan 2024",
            responsibilities: [
                "User Interface Development",
                "Application Structure",
                "Angular Framework Expertise",
                "Responsive Design",
                "API Integration"
            ]
        },
        {
            title: "Research Assistant Intern",
            company: "Industrial 4.0 Research Center",
            location: "Istanbul, Turkey",
            duration: "Oct 2023 - Jan 2024",
            responsibilities: [
                "Data Collection and Analysis",
                "Literature review, Report writing and Documentation",
                "Data entry",
                "Collaboration and Presentation",
                "Critical thinking"
            ]
        },
        {
            title: "Network Technician",
            company: "Tawhid Almas Logistics Company",
            duration: "July 2023 – Sept 2023",
            responsibilities: [
                "Installed and troubleshot networks",
                "Monitored network performance",
                "Managed backup and recovery"
            ]
        }
    ],

    projects: [
        {
            name: "Quizlet – Interactive University Quiz Platform",
            technologies: ["HTML", "CSS", "JavaScript", "Responsive"],
            description: "A web-based quiz application designed to help students practice and test their knowledge in university-level courses.",
            details: [
                "Role: Sole Developer.",
                "Challenge: Creating a dynamic quiz system with real-time feedback and scoring.",
                "Outcome: Successfully launched a platform used by students to prepare for exams."
            ],
            liveDemo: "https://tariqahmaad.github.io/quizlet/index.html",
            github: "https://github.com/tariqahmaad/quizlet"
        },
        {
            name: "BudgetWise – React Native Expense Tracker",
            technologies: ["React Native", "JavaScript", "Node.js", "Google Firebase", "REST API"],
            description: "Mobile-first finance tracker built with React Native and Firebase for seamless cloud-sync.",
            details: [
                "Role: Full-Stack Developer.",
                "Challenge: Ensuring real-time data synchronization between multiple devices using Firebase.",
                "Outcome: Developed a cross-platform mobile app with positive user feedback on its intuitive interface."
            ],
            github: "https://github.com/tariqahmaad/BudgetWise"
        },
        {
            name: "Graduation Project Presentation",
            technologies: ["HTML", "CSS", "JavaScript", "Presentation"],
            description: "Developed an interactive presentation showcasing my graduation project, utilizing HTML, CSS, and JavaScript for a dynamic and engaging user experience.",
            details: [
                "Role: Presenter and Developer.",
                "Challenge: To effectively communicate complex technical concepts to a non-technical audience.",
                "Outcome: Received high marks and commendation for clarity and engaging presentation style."
            ],
            liveDemo: "https://tariqahmaad.github.io/Presentation/index.html",
            github: "https://github.com/tariqahmaad/Presentation"
        },
        {
            name: "Note-Taking Web Applications",
            technologies: ["PHP", "MySQL", "JavaScript", "Authentication"],
            description: "Developed a web-based note-taking app with PHP, MySQL, and front-end technologies, offering secure user authentication, role-specific functions, and a responsive, cross-browser interface.",
            github: "https://github.com/tariqahmaad/Note-Taking-Web-Application"
        },
        {
            name: "Hospital Management System",
            technologies: ["Java", "Spring Boot", "MySQL", "REST API"],
            description: "Created a Java Spring Boot-based Hospital Management System to streamline hospital functions, featuring patient, doctor, and appointment management with RESTful APIs and MySQL.",
            github: "https://github.com/tariqahmaad/Hospital-Management-System"
        },
        {
            name: "Hand-Written Digital Classifier using Neural Networking",
            technologies: ["Python", "Neural Networks", "Deep Learning", "TensorFlow"],
            description: "Developed a Hand-Written Digit Classifier with Neural Networks in a Deep Learning project, demonstrating proficiency in image recognition and machine learning techniques."
        },
        {
            name: "Hotel Management System",
            technologies: ["C#", ".NET", "MySQL", "CRUD"],
            description: "Developed a C# Hotel Management System in Microsoft Visual Studio, featuring CRUD operations for customer and room management, integrated with MySQL for secure data handling."
        },
        {
            name: "Banking Management System",
            technologies: ["Java", "Swing", "GUI", "Security"],
            description: "Created a Java-based Banking Management System with a user-friendly interface for account management, including features like deposit, withdrawal, and account details."
        },
        {
            name: "Airport Management System",
            technologies: ["Python", "Django", "MySQL", "HTML/CSS"],
            description: "Developed a web-based Airport Management System app with HTML, CSS, JS, Python, Django (Framework), and MySQL (Database), offering secure user authentication, role-specific functions, and a responsive interface.",
            github: "https://github.com/tariqahmaad/vercel-project"
        }
    ],

    certifications: [
        {
            name: "React Native",
            issuer: "Meta | Coursera",
            date: "March 2025"
        },
        {
            name: "Unsupervised Learning, Recommenders, Reinforcement Learning",
            issuer: "Stanford | Coursera",
            date: "Sep 2024"
        },
        {
            name: "Supervised Machine Learning: Regression and Classification",
            issuer: "Stanford | Coursera",
            date: "Aug 2024"
        },
        {
            name: "Technical Support Fundamentals",
            issuer: "Google | Coursera",
            date: "Oct 2023 – Dec 2023"
        },
        {
            name: "Crash Course of Python",
            issuer: "Google | Coursera",
            date: "Oct 2023 – Nov 2023"
        },
        {
            name: "Introduction to Large Language Model",
            issuer: "Google | Coursera",
            date: "Oct 2023"
        },
        {
            name: "Introduction to Generative AI",
            issuer: "Google | Coursera",
            date: "July 2023"
        }
    ],

    achievements: [
        {
            name: "IELTS – Overall Band: 6.0",
            issuer: "IDP Education",
            date: "Feb 2025"
        },
        {
            name: "3rd Coding Competition - 2nd Position",
            issuer: "Istanbul Aydin University",
            date: "May 2023",
            details: "Got a 2nd position with my team. Organized by Caretta Software Company."
        }
    ],

    stats: {
        happyClients: 232,
        projects: 38,
        hoursOfSupport: 846,
        awards: 12
    },

    personalInterests: [
        "Soccer", "Reading", "Community volunteering", "Technology", "Innovation"
    ],

    workPhilosophy: [
        "Continuous Learning: 'I believe that the tech field is always evolving, so I dedicate time each week to learn new skills and stay updated with the latest trends.'",
        "Problem-Solving: 'I approach challenges with a methodical and analytical mindset, breaking down complex problems into smaller, manageable parts to find effective solutions.'",
        "Collaboration: 'I thrive in team environments and believe that the best results come from open communication and diverse perspectives.'",
        "User-Centric Design: 'Whether it's a UI or an API, I always prioritize the end-user's experience to create intuitive and efficient applications.'"
    ],

    testimonials: [
        {
            author: "Alparslan Horasan",
            position: "Assistant Professor",
            text: "Your ability to tackle complex problems with innovative solutions is truly impressive. Your passion for technology shines through in your work, making you an invaluable asset to any team."
        },
        {
            author: "Selçuk Şener",
            position: "Senior Software Developer",
            text: "I am consistently amazed by your dedication and teamwork. You have a knack for bringing people together and fostering a collaborative environment that leads to incredible results."
        },
        {
            author: "Roa'a Ali",
            position: "Assistant Professor",
            text: "Your coding skills are exceptional. You have a deep understanding of computer engineering principles, and your ability to write efficient, clean code is commendable."
        },
        {
            author: "Wasim Raed",
            position: "Senior Professor",
            text: "Your creativity in approaching engineering challenges is outstanding. You have a unique way of thinking outside the box, which leads to innovative and effective solutions."
        },
        {
            author: "Zafer Aslan",
            position: "Vice Dean",
            text: "Your passion for continuous learning and staying updated with the latest technological trends is admirable. It's rare to see someone so dedicated to personal and professional growth."
        }
    ]
};

// Debug: Log when knowledge base is fully loaded
console.log('✅ Knowledge Base Loaded Successfully:', {
    timestamp: new Date().toISOString(),
    totalProjects: knowledgeBase.projects.length,
    totalCertifications: knowledgeBase.certifications.length,
    totalExperience: knowledgeBase.experience.length,
    latestCertification: knowledgeBase.certifications[0]?.name || 'None',
    latestProject: knowledgeBase.projects[0]?.name || 'None'
});
