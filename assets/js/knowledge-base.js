/**
 * AI Assistant Knowledge Base
 * This file contains all the portfolio data for the AI assistant.
 * Version: 20260313
 */

export const knowledgeBase = {
    personal: {
        name: "Tariq Ahmad",
        title: "Computer Engineer",
        location: "Istanbul, Turkey",
        email: "tariq_muzamil@live.com",
        phone: "+90 534 540 3345",
        degree: "BSc Computer Engineering",
        university: "Istanbul Aydin University",
        cgpa: "3.36/4.0",
        graduationYear: "2021-2025",
        linkedin: "https://www.linkedin.com/in/tariq-ahmad-a43320264",
        github: "https://github.com/tariqahmaad",
        twitter: "https://x.com/arrick007",
        facebook: "https://www.facebook.com/tariq.ahmaaad",
        instagram: "https://www.instagram.com/0xtahmad/",
        freelance: "Available",
        spokenLanguages: ["English", "Dari", "Pashto", "Hindi"],
        bio: "A Computer Engineering graduate from Istanbul Aydin University with a passion for full-stack development, machine learning, and building impactful software solutions.",
        availabilityDetails: "Open to full-time positions, freelance projects, and collaboration opportunities in software engineering."
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
            location: "Istanbul, Turkey",
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
            details: [
                "Role: Full-Stack Developer.",
                "Challenge: Implementing secure authentication and role-based access control with PHP.",
                "Outcome: Delivered a fully functional note-taking platform with user management and a clean responsive UI."
            ],
            github: "https://github.com/tariqahmaad/Note-Taking-Web-Application"
        },
        {
            name: "Hospital Management System",
            technologies: ["Java", "Spring Boot", "MySQL", "REST API"],
            description: "Created a Java Spring Boot-based Hospital Management System to streamline hospital functions, featuring patient, doctor, and appointment management with RESTful APIs and MySQL.",
            details: [
                "Role: Backend Developer.",
                "Challenge: Designing a robust RESTful API architecture for managing complex hospital data relationships.",
                "Outcome: Built a comprehensive system with patient, doctor, and appointment management modules."
            ],
            github: "https://github.com/tariqahmaad/Hospital-Management-System"
        },
        {
            name: "Hand-Written Digital Classifier using Neural Networking",
            technologies: ["Python", "Neural Networks", "Deep Learning", "TensorFlow"],
            description: "Developed a Hand-Written Digit Classifier with Neural Networks in a Deep Learning project, demonstrating proficiency in image recognition and machine learning techniques.",
            details: [
                "Role: ML Engineer.",
                "Challenge: Training an accurate neural network model for digit classification on the MNIST dataset.",
                "Outcome: Achieved high classification accuracy, demonstrating strong understanding of deep learning concepts."
            ]
        },
        {
            name: "Hotel Management System",
            technologies: ["C#", ".NET", "MySQL", "CRUD"],
            description: "Developed a C# Hotel Management System in Microsoft Visual Studio, featuring CRUD operations for customer and room management, integrated with MySQL for secure data handling.",
            details: [
                "Role: Desktop Application Developer.",
                "Challenge: Building a reliable CRUD system with proper data validation and MySQL integration.",
                "Outcome: Delivered a functional hotel management tool with an intuitive Windows Forms interface."
            ]
        },
        {
            name: "Banking Management System",
            technologies: ["Java", "Swing", "GUI", "Security"],
            description: "Created a Java-based Banking Management System with a user-friendly interface for account management, including features like deposit, withdrawal, and account details.",
            details: [
                "Role: Java Developer.",
                "Challenge: Implementing secure transaction logic and account management within a Swing GUI.",
                "Outcome: Built a complete banking simulation with deposit, withdrawal, and balance tracking features."
            ]
        },
        {
            name: "CV Builder",
            technologies: ["Next.js", "TypeScript", "React", "Firebase", "Tailwind CSS"],
            description: "A modern, privacy-first resume builder with real-time preview, multiple ATS-friendly templates, PDF export, version control, and Firebase authentication. Full-stack application deployed on Vercel.",
            details: [
                "Role: Full-Stack Developer.",
                "Challenge: Building a real-time dual-pane editor with live preview, PDF generation, and conflict resolution for offline/cloud sync.",
                "Outcome: Delivered a production-ready application with guest mode, dark mode, auto-save, and multiple resume templates."
            ],
            github: "https://github.com/tariqahmaad/CV-Builder",
            liveDemo: "https://ta-cv.vercel.app/"
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
            name: "Oxford ELLT – Overall Level: 8",
            issuer: "Oxford English Language Level Test",
            date: "Aug 2025"
        },
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
        projects: 9,
        awards: 3,
        certifications: 7,
        experience: 5
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
            text: "Tariq stood out in our department for the range of his technical work. During his time at the Industrial 4.0 Research Center, he handled systematic literature reviews and mixed methods data analysis with a level of rigor I normally expect from graduate students. His graduation project further demonstrated solid engineering fundamentals — he is someone who does not shy away from unfamiliar problems."
        },
        {
            author: "Selçuk Şener",
            position: "Senior Software Developer",
            text: "I worked with Tariq during his frontend development internship, where he picked up Angular quickly and delivered clean, well-structured components on schedule. He also placed second in the university coding competition organized by Caretta, which confirmed he can perform under pressure. His GitHub shows a consistent pattern of building full-stack projects end to end, not just following tutorials."
        },
        {
            author: "Roa'a Ali",
            position: "Assistant Professor",
            text: "What I appreciated about Tariq was his willingness to go beyond the assignment. In coursework, he explored topics in depth rather than just meeting requirements. His Hospital Management System, built with Spring Boot and MySQL, showed he could design a proper REST API architecture on his own. The fact that he speaks four languages and still maintains strong technical communication in English says a lot about his adaptability."
        },
        {
            author: "Wasim Raed",
            position: "Senior Professor",
            text: "Tariq's trajectory over the course of his degree was noticeable. He came in with strong fundamentals and steadily expanded into areas like machine learning and cloud-deployed applications, completing Stanford's ML certification sequence alongside his regular coursework. The handwritten digit classifier he built with TensorFlow showed genuine understanding of neural network concepts, not just library calls. He has the discipline to keep learning long after the classroom ends."
        },
        {
            author: "Zafer Aslan",
            position: "Vice Dean",
            text: "Tariq's sustained involvement with the Industrial 4.0 Research Center — across three separate internship roles over nearly two years — speaks for itself. He contributed to literature reviews, experimental design, and technical presentations, and returned each time with more responsibility. That kind of reliability and growth is not common among undergraduate students."
        }
    ]
};
