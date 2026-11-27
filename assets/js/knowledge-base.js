/**
 * AI Assistant Knowledge Base
 * This file contains all the portfolio data for the AI assistant.
 * Version: 20261108
 */

export const knowledgeBase = {
    personal: {
        name: "Tariq Ahmad",
        title: "Computer Engineer",
        location: "Details available on request",
        email: "tariq2u24@gmail.com",
        phone: "Available on request — please email me",
        degree: "BSc Computer Engineering",
        university: "Istanbul Aydin University",
        cgpa: "3.36/4.0",
        graduationYear: "2021-2025",
        linkedin: "https://www.linkedin.com/in/tariq-ahmad-a43320264",
        github: "https://github.com/tariqahmaad",
        freelance: "Available",
        spokenLanguages: ["English", "Dari", "Pashto", "Hindi"],
        bio: "Computer Engineering graduate from Istanbul Aydin University focused on full-stack web and mobile development, backend systems, and applied machine learning.",
        availabilityDetails: "Open to full-time software engineering roles and select freelance projects, remote or on-site."
    },

    skills: {
        languages: ["C", "C++", "C#", "Java", "Python", "JavaScript", "TypeScript", "PHP"],
        frameworks: ["Django (Python)", "Spring Boot (Java)", "React (JavaScript)", "Next.js", "React Native", "Angular", "Node.js", "Tailwind CSS", "Bootstrap (CSS/JavaScript)"],
        databases: ["MySQL", "PostgreSQL", "MongoDB", "Firebase", "SQLite"],
        tools: ["Git", "Docker", "TensorFlow", "VS Code", "Photoshop"],
        networking: ["CCNA", "TCP/IP", "LAN/WAN"],
        os: ["Windows", "Linux", "macOS"],
        markup: ["HTML", "CSS"],
        softSkills: ["Teamwork", "Communication", "Problem Solving", "Time Management"]
    },

    experience: [
        {
            title: "Researcher Intern",
            company: "Industrial 4.0 Research Center",
            duration: "Oct 2024 – Jul 2025",
            responsibilities: [
                "Conducted systematic literature reviews on Industry 4.0 methods and architectures",
                "Analyzed research datasets using mixed-methods evaluation",
                "Designed and prototyped experimental setups with the research team",
                "Authored technical reports and presented findings to faculty reviewers"
            ]
        },
        {
            title: "Engineering Researcher Intern",
            company: "Industrial 4.0 Research Center",
            duration: "Mar 2024 – Jun 2024",
            responsibilities: [
                "Reviewed engineering literature and documented technical benchmarks",
                "Collected, cleaned, and analyzed experimental datasets",
                "Collaborated on lab experiments and early-stage system prototypes",
                "Prepared progress reports and group technical presentations"
            ]
        },
        {
            title: "Frontend Developer (Angular) Intern",
            company: "Caretta Software Company",
            duration: "Nov 2023 – Jan 2024",
            responsibilities: [
                "Built reusable Angular UI components following the team's application architecture",
                "Implemented responsive layouts across desktop and mobile viewports",
                "Integrated frontend views with backend REST APIs",
                "Collaborated with senior developers on code reviews and UI refinements"
            ]
        },
        {
            title: "Research Assistant Intern",
            company: "Industrial 4.0 Research Center",
            duration: "Oct 2023 – Jan 2024",
            responsibilities: [
                "Assisted with literature reviews, documentation, and technical report writing",
                "Handled structured data collection, entry, and initial analysis",
                "Supported team meetings and research presentations"
            ]
        },
        {
            title: "Network Technician",
            company: "Tawhid Almas Logistics Company",
            duration: "Jul 2023 – Sep 2023",
            responsibilities: [
                "Installed, configured, and troubleshot local office networks",
                "Monitored network uptime and diagnosed connectivity issues",
                "Managed routine system backups and recovery procedures"
            ]
        }
    ],

    projects: [
        {
            slug: "cv-builder",
            name: "CV Builder",
            technologies: ["Next.js", "TypeScript", "React", "Firebase", "Tailwind CSS"],
            description: "Privacy-first resume builder with a dual-pane live editor, ATS-friendly templates, clean PDF export, and version history, built with Next.js and Firebase.",
            details: [
                "Role: Full-Stack Developer.",
                "Challenge: Building a real-time dual-pane editor with live preview, PDF generation, and conflict resolution for offline/cloud sync.",
                "Outcome: Delivered a production-ready application with guest mode, dark mode, auto-save, and multiple resume templates."
            ],
            architecture: "Client-first Next.js and TypeScript state powers the dual-pane editor so previews update synchronously on every keystroke without server round-trips. Guests store drafts in local storage with zero sign-up friction, while signed-in users sync snapshots to Firebase with timestamped conflict checks. Printable layouts use dedicated CSS print rules rather than headless screenshots so exported PDFs stay crisp and ATS-parseable.",
            highlights: [
                "Dual-pane live editor with instant ATS-friendly template switching and clean PDF export.",
                "Privacy-first guest mode alongside optional Firebase authentication and cloud sync.",
                "Auto-save and version history built with Next.js, TypeScript, and Tailwind CSS."
            ],
            liveDemo: "https://ta-cv.vercel.app/"
        },
        {
            slug: "quizlet",
            name: "Quizlet – Interactive University Quiz Platform",
            technologies: ["HTML", "CSS", "JavaScript", "Responsive"],
            description: "Web-based quiz platform built for university students to practice course material with timed sessions, instant answer feedback, and real-time scoring.",
            details: [
                "Role: Sole Developer.",
                "Challenge: Creating a dynamic quiz system with real-time feedback and scoring.",
                "Outcome: Shipped a responsive practice platform used by students to prepare for exams."
            ],
            highlights: [
                "Course-specific question banks with timer-based practice sessions.",
                "Instant answer feedback and real-time score calculation in vanilla JavaScript.",
                "Responsive layout built for quick exam prep on both desktop and mobile devices."
            ],
            liveDemo: "https://tariqahmaad.github.io/quizlet/index.html",
            github: "https://github.com/tariqahmaad/quizlet"
        },
        {
            slug: "budgetwise",
            name: "BudgetWise – React Native Expense Tracker",
            technologies: ["React Native", "JavaScript", "Node.js", "Google Firebase", "REST API"],
            description: "Cross-platform mobile expense tracker built with React Native and Firebase for logging daily spending, setting category budgets, and syncing data in real time.",
            details: [
                "Role: Full-Stack Developer.",
                "Challenge: Ensuring real-time data synchronization between multiple devices using Firebase.",
                "Outcome: Shipped a cross-platform mobile expense tracker with responsive logging and real-time cloud sync."
            ],
            architecture: "React Native handles cross-platform views backed by a lightweight Node.js REST layer and Firebase real-time sync. Expense records are normalized by category and month so summary charts recalculate locally without heavy queries, keeping daily logging responsive even on unreliable mobile connections.",
            highlights: [
                "Cross-platform mobile UI for daily expense logging and category budget limits.",
                "Real-time cloud synchronization across devices powered by Firebase and RESTful APIs.",
                "Visual spending summaries designed for quick glanceability on mobile screens."
            ],
            github: "https://github.com/tariqahmaad/BudgetWise"
        },
        {
            slug: "graduation-presentation",
            name: "Graduation Project Presentation",
            technologies: ["HTML", "CSS", "JavaScript", "Presentation"],
            description: "Custom browser-based interactive slide deck built with HTML, CSS, and JavaScript to walk technical and non-technical audiences through my graduation project.",
            details: [
                "Role: Presenter and Developer.",
                "Challenge: Translating complex engineering concepts into a clear, engaging walkthrough for mixed technical and non-technical audiences.",
                "Outcome: Received high marks and positive feedback for clarity and presentation flow."
            ],
            highlights: [
                "Custom browser-based slide deck with smooth transitions and keyboard navigation.",
                "Structured visual storytelling translating complex engineering concepts for mixed audiences.",
                "Hosted statically on GitHub Pages for instant, zero-install access from any browser."
            ],
            liveDemo: "https://tariqahmaad.github.io/Presentation/index.html",
            github: "https://github.com/tariqahmaad/Presentation"
        },
        {
            slug: "note-taking-app",
            name: "Note-Taking Web Application",
            technologies: ["PHP", "MySQL", "JavaScript", "Authentication"],
            description: "Full-stack note-taking web app built with PHP, MySQL, and JavaScript featuring session-based authentication, role-specific permissions, and a responsive interface.",
            details: [
                "Role: Full-Stack Developer.",
                "Challenge: Implementing secure authentication and role-based access control with PHP.",
                "Outcome: Delivered a full-stack note-taking platform with user management and a responsive UI."
            ],
            highlights: [
                "Session-based user authentication with role-specific permissions and account isolation.",
                "Relational MySQL schema backing full create, edit, organize, and delete note workflows.",
                "Responsive, cross-browser front end built with clean HTML, CSS, and JavaScript."
            ],
            github: "https://github.com/tariqahmaad/Note-Taking-Web-Application"
        },
        {
            slug: "hospital-management",
            name: "Hospital Management System",
            technologies: ["Java", "Spring Boot", "MySQL", "REST API"],
            description: "Backend hospital management system built with Java, Spring Boot, and MySQL, providing structured REST APIs for managing patients, doctors, and appointments.",
            details: [
                "Role: Backend Developer.",
                "Challenge: Designing a structured RESTful API architecture for managing interconnected hospital data.",
                "Outcome: Built a layered backend system with patient, doctor, and appointment management modules."
            ],
            architecture: "Structured as a three-layer Spring Boot service—REST controllers for input validation and HTTP semantics, service classes encapsulating scheduling rules, and Spring Data repositories over a normalized MySQL schema. Separating patient, doctor, and appointment tables with foreign-key constraints keeps scheduling integrity enforced at both the API and database layers.",
            highlights: [
                "Layered Spring Boot REST API separating controllers, business services, and repositories.",
                "Normalized MySQL data model linking patients, doctors, and appointment schedules.",
                "Structured validation and error handling for reliable multi-entity CRUD workflows."
            ],
            github: "https://github.com/tariqahmaad/Hospital-Management-System"
        },
        {
            slug: "digit-classifier",
            name: "Handwritten Digit Classifier",
            technologies: ["Python", "Neural Networks", "Deep Learning", "TensorFlow"],
            description: "Deep learning pipeline built in Python and TensorFlow that preprocesses, trains, and evaluates a multi-layer neural network on the MNIST handwritten digit dataset.",
            details: [
                "Role: ML Engineer.",
                "Challenge: Training an accurate neural network model for digit classification on the MNIST dataset.",
                "Outcome: Trained and evaluated a multi-layer TensorFlow model that generalizes reliably to unseen MNIST digits."
            ],
            highlights: [
                "End-to-end preprocessing, training, and evaluation pipeline on the MNIST benchmark dataset.",
                "Multi-layer neural network implemented in Python and TensorFlow with tuned hyperparameters.",
                "Evaluation of accuracy and confusion patterns to verify generalization on unseen digits."
            ]
        },
        {
            slug: "hotel-management",
            name: "Hotel Management System",
            technologies: ["C#", ".NET", "MySQL", "CRUD"],
            description: "Windows Forms desktop application built with C#, .NET, and MySQL for front-desk operations, covering guest records, room inventory, bookings, and input validation.",
            details: [
                "Role: Desktop Application Developer.",
                "Challenge: Building a reliable CRUD system with proper data validation and MySQL integration.",
                "Outcome: Delivered a desktop hotel management tool with a clean Windows Forms interface."
            ],
            highlights: [
                "Desktop Windows Forms interface built in C# and .NET for front-desk operations.",
                "Parameterized MySQL queries managing guest records, room inventory, and bookings.",
                "Input validation and structured error states to keep reservation data consistent."
            ]
        },
        {
            slug: "banking-management",
            name: "Banking Management System",
            technologies: ["Java", "Swing", "GUI", "Security"],
            description: "Desktop banking simulation built with Java Swing covering account lookup, deposits, withdrawals, balance tracking, and transaction validation.",
            details: [
                "Role: Java Developer.",
                "Challenge: Implementing reliable transaction logic and account validation within a Swing GUI.",
                "Outcome: Built a desktop banking simulation with deposit, withdrawal, and balance tracking workflows."
            ],
            highlights: [
                "Object-oriented Java core enforcing balance checks on deposits and withdrawals.",
                "Desktop Java Swing GUI for account lookup, transaction history, and balance tracking.",
                "Defensive transaction validation preventing invalid or negative-balance operations."
            ]
        }
    ],

    certifications: [
        {
            name: "React Native",
            issuer: "Meta | Coursera",
            date: "Mar 2025"
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
            name: "Crash Course on Python",
            issuer: "Google | Coursera",
            date: "Oct 2023 – Nov 2023"
        },
        {
            name: "Introduction to Large Language Models",
            issuer: "Google | Coursera",
            date: "Oct 2023"
        },
        {
            name: "Introduction to Generative AI",
            issuer: "Google | Coursera",
            date: "Jul 2023"
        }
    ],

    achievements: [
        {
            name: "Oxford ELLT – Overall Level: 8",
            issuer: "Oxford English Language Level Test",
            date: "Nov 2025"
        },
        {
            name: "IELTS – Overall Band: 6.0",
            issuer: "IDP Education",
            date: "Feb 2025"
        },
        {
            name: "Coding Competition (3rd edition) - 2nd Position",
            issuer: "Istanbul Aydin University",
            date: "May 2023",
            details: "Placed 2nd overall with my team in a competition organized by Caretta Software Company."
        }
    ],

    stats: {
        projects: 9,
        awards: 3,
        certifications: 7,
        experience: 5
    },

    personalInterests: [
        "Soccer", "Reading", "Community volunteering"
    ],

    workPhilosophy: [
        "Keep Learning: 'Technology moves fast, so I set aside time each week to pick up new tools and test ideas in small projects.'",
        "Break Problems Down: 'When a problem looks messy, I split it into smaller pieces, verify assumptions early, and keep the solution simple.'",
        "Clear Collaboration: 'Good engineering teams run on honest feedback, clear communication, and code the next person can actually read.'",
        "Build for the User: 'Whether I'm designing an interface or a REST API, clarity for the person using it comes first.'"
    ],

    testimonials: [
        {
            author: "Alparslan Horasan",
            position: "Assistant Professor",
            text: "I supervised Tariq at the Industrial 4.0 Research Center beginning in his second year. He approached foundational research tasks, including literature reviews, dataset preparation, and repeated experimental runs, with patience and care. His graduation project reflected that same methodological discipline, and I regard him as one of the most reliable students I have advised."
        },
        {
            author: "Selçuk Şener",
            position: "Senior Software Developer",
            text: "During his frontend internship with our team at Caretta, Tariq picked up Angular quickly and was contributing clean, well-structured components within his first few weeks. He asked thoughtful questions about design trade-offs and placed second in our university coding competition. His personal repositories show the same habit of seeing software projects through to completion."
        },
        {
            author: "Roa'a Ali",
            position: "Assistant Professor",
            text: "Tariq consistently went beyond minimum coursework expectations in my classes. Outside of assigned labs, he independently designed and built a Hospital Management System in Spring Boot and MySQL to practice backend architecture properly. He also explains technical material clearly in English, and his ability to work across four languages is a genuine asset in collaborative environments."
        },
        {
            author: "Wasim Raed",
            position: "Senior Professor",
            text: "Throughout his undergraduate studies, Tariq demonstrated strong intellectual curiosity. He frequently used office hours to discuss machine learning architectures and deployment practices beyond the course syllabus, and completed Stanford's machine learning sequence alongside his regular load. In his TensorFlow digit classifier, it was clear he understood the underlying mathematics rather than treating the framework as a black box."
        },
        {
            author: "Zafer Aslan",
            position: "Vice Dean",
            text: "Tariq's sustained work at our Industrial 4.0 Research Center across three terms speaks to his consistency and maturity. Over time he progressed from literature reviews to assisting with experimental design and presenting research findings to faculty. That level of steady responsibility is uncommon at the undergraduate level, and I recommend him without reservation."
        }
    ]
};
