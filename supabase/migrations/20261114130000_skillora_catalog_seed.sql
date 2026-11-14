begin;

-- Idempotent shared catalogue seed. This migration never inserts learner-owned
-- rows such as profiles, skills, enrollments, progress, or attempts.

insert into public.skills (name, category, description)
values
  ('Python', 'Programming', 'General-purpose programming for applications, automation, and data work.'),
  ('Java', 'Programming', 'Object-oriented programming for backend and enterprise applications.'),
  ('C', 'Programming', 'Low-level programming fundamentals, memory, and systems concepts.'),
  ('JavaScript', 'Frontend', 'The language of interactive web applications and modern Node.js services.'),
  ('React', 'Frontend', 'Component-based UI development for modern web applications.'),
  ('HTML', 'Frontend', 'Semantic structure and accessible document foundations for the web.'),
  ('CSS', 'Frontend', 'Responsive layouts, visual styling, and maintainable design systems.'),
  ('Node.js', 'Backend', 'Server-side JavaScript runtime for APIs and backend services.'),
  ('SQL', 'Data', 'Relational querying, joins, aggregation, and data manipulation.'),
  ('PostgreSQL', 'Data', 'Production relational database design and PostgreSQL operations.'),
  ('Git', 'Tools', 'Version control workflows for collaborative software development.'),
  ('Data Structures', 'Computer Science', 'Core structures and algorithms for efficient problem solving.'),
  ('Machine Learning', 'Artificial Intelligence', 'Supervised, unsupervised, and applied machine learning methods.'),
  ('Artificial Intelligence', 'Artificial Intelligence', 'AI concepts, model usage, evaluation, and responsible application.'),
  ('Cybersecurity', 'Security', 'Security principles, threat awareness, and defensive engineering.'),
  ('Cloud Fundamentals', 'Cloud', 'Core cloud concepts, networking, identity, and managed services.'),
  ('AWS', 'Cloud', 'Foundational AWS services and cloud deployment patterns.'),
  ('Docker', 'DevOps', 'Containerization and repeatable application environments.'),
  ('REST APIs', 'Backend', 'Resource-oriented API design, validation, and integration.'),
  ('Testing', 'Engineering', 'Unit, integration, and quality practices for reliable software.'),
  ('Statistics', 'Data', 'Probability and statistical reasoning for data-driven decisions.'),
  ('Data Analysis', 'Data', 'Data cleaning, exploration, visualization, and communication.'),
  ('Pandas', 'Data', 'Python data manipulation and analysis with tabular datasets.'),
  ('TensorFlow', 'Artificial Intelligence', 'Model development and deployment with TensorFlow.'),
  ('Network Security', 'Security', 'Network threats, controls, monitoring, and secure configuration.'),
  ('Linux', 'Systems', 'Command-line operations, processes, permissions, and server fundamentals.'),
  ('System Design', 'Engineering', 'Designing reliable, scalable, and maintainable software systems.')
on conflict (name) do update
set category = excluded.category,
    description = excluded.description;

insert into public.career_roles (title, category, description, experience_level)
values
  ('Full Stack Developer', 'Software Engineering', 'Build complete web products across frontend, backend, databases, and deployment.', 'intermediate'),
  ('Frontend Developer', 'Software Engineering', 'Create accessible, responsive, and maintainable interfaces for web products.', 'beginner'),
  ('Backend Developer', 'Software Engineering', 'Design APIs, services, data models, and reliable server-side systems.', 'intermediate'),
  ('Python Developer', 'Software Engineering', 'Build automation, web services, data tools, and applications with Python.', 'beginner'),
  ('Data Analyst', 'Data', 'Turn structured data into trustworthy insights, reports, and decisions.', 'beginner'),
  ('Data Scientist', 'Data', 'Use statistics, experimentation, and machine learning to solve complex data problems.', 'intermediate'),
  ('Machine Learning Engineer', 'Artificial Intelligence', 'Productionize machine learning models and the systems around them.', 'advanced'),
  ('AI Engineer', 'Artificial Intelligence', 'Build useful AI-powered applications with models, evaluation, and reliable integrations.', 'intermediate'),
  ('Cybersecurity Analyst', 'Security', 'Monitor, investigate, and improve an organization''s security posture.', 'beginner'),
  ('Cloud Engineer', 'Cloud', 'Deploy, operate, and improve secure cloud infrastructure and application platforms.', 'intermediate')
on conflict (title) do update
set category = excluded.category,
    description = excluded.description,
    experience_level = excluded.experience_level;

with required(role_title, skill_name, proficiency, priority) as (
  values
    ('Full Stack Developer', 'JavaScript', 75, 'high'),
    ('Full Stack Developer', 'React', 70, 'high'),
    ('Full Stack Developer', 'Node.js', 70, 'high'),
    ('Full Stack Developer', 'SQL', 70, 'high'),
    ('Full Stack Developer', 'Git', 65, 'medium'),
    ('Full Stack Developer', 'REST APIs', 70, 'high'),
    ('Full Stack Developer', 'System Design', 60, 'medium'),
    ('Frontend Developer', 'HTML', 80, 'high'),
    ('Frontend Developer', 'CSS', 80, 'high'),
    ('Frontend Developer', 'JavaScript', 80, 'high'),
    ('Frontend Developer', 'React', 75, 'high'),
    ('Frontend Developer', 'Testing', 60, 'medium'),
    ('Backend Developer', 'JavaScript', 65, 'medium'),
    ('Backend Developer', 'Node.js', 80, 'high'),
    ('Backend Developer', 'SQL', 80, 'high'),
    ('Backend Developer', 'REST APIs', 80, 'high'),
    ('Backend Developer', 'Docker', 60, 'medium'),
    ('Backend Developer', 'System Design', 70, 'high'),
    ('Python Developer', 'Python', 85, 'high'),
    ('Python Developer', 'SQL', 65, 'medium'),
    ('Python Developer', 'REST APIs', 65, 'medium'),
    ('Python Developer', 'Testing', 60, 'medium'),
    ('Python Developer', 'Git', 60, 'medium'),
    ('Data Analyst', 'SQL', 80, 'high'),
    ('Data Analyst', 'Statistics', 75, 'high'),
    ('Data Analyst', 'Data Analysis', 85, 'high'),
    ('Data Analyst', 'Pandas', 75, 'high'),
    ('Data Analyst', 'Python', 60, 'medium'),
    ('Data Scientist', 'Python', 80, 'high'),
    ('Data Scientist', 'Statistics', 85, 'high'),
    ('Data Scientist', 'Data Analysis', 75, 'high'),
    ('Data Scientist', 'Machine Learning', 75, 'high'),
    ('Data Scientist', 'SQL', 65, 'medium'),
    ('Machine Learning Engineer', 'Python', 85, 'high'),
    ('Machine Learning Engineer', 'Machine Learning', 85, 'high'),
    ('Machine Learning Engineer', 'TensorFlow', 75, 'high'),
    ('Machine Learning Engineer', 'Data Structures', 70, 'medium'),
    ('Machine Learning Engineer', 'Docker', 60, 'medium'),
    ('AI Engineer', 'Python', 80, 'high'),
    ('AI Engineer', 'Artificial Intelligence', 85, 'high'),
    ('AI Engineer', 'Machine Learning', 75, 'high'),
    ('AI Engineer', 'REST APIs', 70, 'medium'),
    ('AI Engineer', 'Docker', 60, 'medium'),
    ('Cybersecurity Analyst', 'Cybersecurity', 85, 'high'),
    ('Cybersecurity Analyst', 'Network Security', 80, 'high'),
    ('Cybersecurity Analyst', 'Linux', 70, 'high'),
    ('Cybersecurity Analyst', 'Python', 55, 'medium'),
    ('Cybersecurity Analyst', 'Cloud Fundamentals', 55, 'medium'),
    ('Cloud Engineer', 'Cloud Fundamentals', 85, 'high'),
    ('Cloud Engineer', 'AWS', 80, 'high'),
    ('Cloud Engineer', 'Linux', 75, 'high'),
    ('Cloud Engineer', 'Docker', 75, 'high'),
    ('Cloud Engineer', 'System Design', 70, 'medium')
)
insert into public.career_required_skills (career_role_id, skill_id, required_proficiency, priority)
select role.id, skill.id, required.proficiency, required.priority
from required
join public.career_roles role on role.title = required.role_title
join public.skills skill on skill.name = required.skill_name
on conflict (career_role_id, skill_id) do update
set required_proficiency = excluded.required_proficiency,
    priority = excluded.priority;

insert into public.courses (title, description, provider, category, difficulty, duration_hours)
select seed.title, seed.description, 'Skillora Academy', seed.category, seed.difficulty, seed.duration_hours
from (values
  ('Python Programming Foundations', 'Learn Python syntax, functions, modules, error handling, and practical automation through small projects.', 'Programming', 'beginner', 12.0),
  ('Java Programming Essentials', 'Build a strong Java foundation with object-oriented design, collections, exceptions, and testing.', 'Programming', 'beginner', 14.0),
  ('C Programming and Memory Fundamentals', 'Understand C syntax, pointers, memory, structs, and problem solving close to the machine.', 'Programming', 'beginner', 12.0),
  ('Modern JavaScript Essentials', 'Master modern JavaScript syntax, asynchronous code, modules, browser APIs, and clean application patterns.', 'Frontend', 'beginner', 10.0),
  ('React Application Development', 'Create maintainable React applications with components, state, routing, forms, and accessibility.', 'Frontend', 'intermediate', 14.0),
  ('HTML and CSS Responsive Design', 'Build semantic, accessible, responsive interfaces with layout primitives and reusable styling patterns.', 'Frontend', 'beginner', 10.0),
  ('SQL for Application Developers', 'Query, model, and update relational data using joins, aggregation, constraints, and transactions.', 'Data', 'beginner', 10.0),
  ('PostgreSQL Database Development', 'Design production-ready PostgreSQL schemas, indexes, permissions, and reliable migrations.', 'Data', 'intermediate', 12.0),
  ('Git and GitHub Collaboration', 'Use branches, pull requests, reviews, history, and release workflows for collaborative development.', 'Tools', 'beginner', 6.0),
  ('Data Structures and Algorithms', 'Practice arrays, maps, trees, graphs, complexity analysis, and systematic problem solving.', 'Computer Science', 'intermediate', 16.0),
  ('Applied Machine Learning', 'Prepare data, train baseline models, evaluate results, and communicate machine learning trade-offs.', 'Artificial Intelligence', 'intermediate', 18.0),
  ('Artificial Intelligence Fundamentals', 'Understand AI concepts, model capabilities, evaluation, responsible use, and application architecture.', 'Artificial Intelligence', 'beginner', 8.0),
  ('Cybersecurity Foundations', 'Learn security principles, common threats, defensive controls, incident awareness, and secure habits.', 'Security', 'beginner', 10.0),
  ('Cloud Engineering Foundations', 'Learn cloud networking, identity, containers, deployment concepts, and operational fundamentals.', 'Cloud', 'intermediate', 14.0)
) as seed(title, description, category, difficulty, duration_hours)
where not exists (select 1 from public.courses course where course.title = seed.title);

-- The current schema has no course_skills junction, so course-to-role
-- relationships remain represented by catalogue categories and descriptions.
insert into public.course_modules (course_id, title, description, sequence_number)
select course.id, module.title, module.description, module.sequence_number
from public.courses course
join (values
  ('Python Programming Foundations', 'Programming foundations', 'Core concepts and vocabulary for this course.', 1),
  ('Python Programming Foundations', 'Guided practice', 'Apply the concepts in focused exercises.', 2),
  ('Python Programming Foundations', 'Build and review', 'Complete a small project and review the result.', 3),
  ('Java Programming Essentials', 'Object-oriented foundations', 'Classes, objects, interfaces, and reusable design.', 1),
  ('Java Programming Essentials', 'Collections and errors', 'Work with collections, exceptions, and robust code.', 2),
  ('Java Programming Essentials', 'Build and review', 'Apply Java skills in a small maintainable application.', 3),
  ('C Programming and Memory Fundamentals', 'C language foundations', 'Types, control flow, functions, and compilation.', 1),
  ('C Programming and Memory Fundamentals', 'Memory and data', 'Pointers, arrays, structs, and safe memory practices.', 2),
  ('C Programming and Memory Fundamentals', 'Systems practice', 'Build and debug a small command-line program.', 3),
  ('Modern JavaScript Essentials', 'Language foundations', 'Modern syntax, types, functions, and modules.', 1),
  ('Modern JavaScript Essentials', 'Asynchronous applications', 'Promises, async flows, and browser interactions.', 2),
  ('Modern JavaScript Essentials', 'Application practice', 'Build and test a small interactive feature.', 3),
  ('React Application Development', 'React foundations', 'Components, JSX, props, and composition.', 1),
  ('React Application Development', 'State and application flow', 'State, effects, routing, and forms.', 2),
  ('React Application Development', 'Accessible product build', 'Ship a maintainable interface and review its quality.', 3),
  ('HTML and CSS Responsive Design', 'Semantic foundations', 'HTML structure, semantics, and accessibility.', 1),
  ('HTML and CSS Responsive Design', 'Layout and responsive styling', 'Flexbox, grid, responsive breakpoints, and tokens.', 2),
  ('HTML and CSS Responsive Design', 'Interface build', 'Create and review a responsive page.', 3),
  ('SQL for Application Developers', 'Relational foundations', 'Tables, keys, relationships, and normalization.', 1),
  ('SQL for Application Developers', 'Queries and reporting', 'Joins, aggregation, filtering, and transactions.', 2),
  ('SQL for Application Developers', 'Data access practice', 'Write queries for a realistic application dataset.', 3),
  ('PostgreSQL Database Development', 'PostgreSQL design', 'Schemas, constraints, data types, and migrations.', 1),
  ('PostgreSQL Database Development', 'Performance and security', 'Indexes, roles, RLS, and query planning.', 2),
  ('PostgreSQL Database Development', 'Production database build', 'Design and validate a small production schema.', 3),
  ('Git and GitHub Collaboration', 'Version control foundations', 'Commits, branches, history, and recovery.', 1),
  ('Git and GitHub Collaboration', 'Team collaboration', 'Pull requests, reviews, issues, and conflicts.', 2),
  ('Git and GitHub Collaboration', 'Release workflow', 'Tags, release hygiene, and repository maintenance.', 3),
  ('Data Structures and Algorithms', 'Complexity and linear structures', 'Big-O, arrays, linked lists, stacks, and queues.', 1),
  ('Data Structures and Algorithms', 'Trees and graphs', 'Traversal, search, and practical graph structures.', 2),
  ('Data Structures and Algorithms', 'Problem-solving practice', 'Select and implement algorithms for real problems.', 3),
  ('Applied Machine Learning', 'Data and problem framing', 'Features, labels, splits, and evaluation goals.', 1),
  ('Applied Machine Learning', 'Models and evaluation', 'Train baseline models and interpret their results.', 2),
  ('Applied Machine Learning', 'Responsible model delivery', 'Package, monitor, and communicate a model responsibly.', 3),
  ('Artificial Intelligence Fundamentals', 'AI concepts', 'Models, tasks, capabilities, and limitations.', 1),
  ('Artificial Intelligence Fundamentals', 'Evaluation and safety', 'Quality, privacy, safety, and responsible use.', 2),
  ('Artificial Intelligence Fundamentals', 'AI application patterns', 'Use AI capabilities in a reliable application flow.', 3),
  ('Cybersecurity Foundations', 'Security principles', 'Threats, assets, risk, and defense in depth.', 1),
  ('Cybersecurity Foundations', 'Application and network defense', 'Common vulnerabilities, controls, and monitoring.', 2),
  ('Cybersecurity Foundations', 'Incident awareness', 'Respond to a basic incident and document findings.', 3),
  ('Cloud Engineering Foundations', 'Cloud architecture', 'Regions, networking, identity, and managed services.', 1),
  ('Cloud Engineering Foundations', 'Containers and deployment', 'Docker, configuration, and repeatable deployments.', 2),
  ('Cloud Engineering Foundations', 'Operations and reliability', 'Observability, cost awareness, and resilience basics.', 3)
) as module(course_title, title, description, sequence_number)
on course.title = module.course_title
on conflict (course_id, sequence_number) do nothing;

insert into public.lessons (module_id, title, duration_minutes, sequence_number)
select module.id, lesson.title, lesson.duration_minutes, lesson.sequence_number
from public.course_modules module
join public.courses course on course.id = module.course_id
join (values
  ('Programming foundations', 'Concepts and terminology', 35, 1),
  ('Programming foundations', 'Guided exercise', 45, 2),
  ('Guided practice', 'Worked example', 40, 1),
  ('Guided practice', 'Independent practice', 50, 2),
  ('Build and review', 'Project brief', 30, 1),
  ('Build and review', 'Review checklist', 35, 2),
  ('Object-oriented foundations', 'Classes and interfaces', 45, 1),
  ('Object-oriented foundations', 'Design exercise', 50, 2),
  ('Collections and errors', 'Collections practice', 45, 1),
  ('Collections and errors', 'Exception handling', 40, 2),
  ('C language foundations', 'Syntax and compilation', 40, 1),
  ('C language foundations', 'Functions exercise', 45, 2),
  ('Memory and data', 'Pointers and arrays', 50, 1),
  ('Memory and data', 'Structs and memory safety', 50, 2),
  ('Systems practice', 'Command-line build', 45, 1),
  ('Systems practice', 'Debugging review', 40, 2),
  ('Language foundations', 'Modern syntax', 40, 1),
  ('Language foundations', 'Modules exercise', 45, 2),
  ('Asynchronous applications', 'Promises and async', 45, 1),
  ('Asynchronous applications', 'Browser integration', 45, 2),
  ('Application practice', 'Feature build', 50, 1),
  ('Application practice', 'Testing review', 40, 2),
  ('React foundations', 'Components and JSX', 45, 1),
  ('React foundations', 'Composition exercise', 50, 2),
  ('State and application flow', 'State and effects', 50, 1),
  ('State and application flow', 'Forms and routing', 50, 2),
  ('Accessible product build', 'Interface build', 55, 1),
  ('Accessible product build', 'Accessibility review', 40, 2),
  ('Semantic foundations', 'HTML semantics', 40, 1),
  ('Semantic foundations', 'Accessible structure', 35, 2),
  ('Layout and responsive styling', 'Flexbox and grid', 45, 1),
  ('Layout and responsive styling', 'Responsive exercise', 50, 2),
  ('Interface build', 'Page implementation', 55, 1),
  ('Interface build', 'Design review', 40, 2),
  ('Relational foundations', 'Keys and relationships', 40, 1),
  ('Relational foundations', 'Normalization exercise', 45, 2),
  ('Queries and reporting', 'Joins and filters', 50, 1),
  ('Queries and reporting', 'Aggregation and transactions', 50, 2),
  ('Data access practice', 'Application query set', 55, 1),
  ('Data access practice', 'Query review', 35, 2),
  ('PostgreSQL design', 'Schema and constraints', 45, 1),
  ('PostgreSQL design', 'Migration exercise', 45, 2),
  ('Performance and security', 'Indexes and planning', 45, 1),
  ('Performance and security', 'RLS exercise', 50, 2),
  ('Production database build', 'Schema implementation', 55, 1),
  ('Production database build', 'Validation review', 40, 2),
  ('Version control foundations', 'Commits and branches', 35, 1),
  ('Version control foundations', 'History exercise', 35, 2),
  ('Team collaboration', 'Pull requests', 40, 1),
  ('Team collaboration', 'Conflict resolution', 40, 2),
  ('Release workflow', 'Tags and releases', 35, 1),
  ('Release workflow', 'Repository review', 35, 2),
  ('Complexity and linear structures', 'Complexity analysis', 45, 1),
  ('Complexity and linear structures', 'Linear structures', 50, 2),
  ('Trees and graphs', 'Tree traversal', 45, 1),
  ('Trees and graphs', 'Graph search', 50, 2),
  ('Problem-solving practice', 'Problem decomposition', 40, 1),
  ('Problem-solving practice', 'Algorithm review', 50, 2),
  ('Data and problem framing', 'Features and labels', 45, 1),
  ('Data and problem framing', 'Dataset preparation', 45, 2),
  ('Models and evaluation', 'Baseline model', 50, 1),
  ('Models and evaluation', 'Evaluation exercise', 50, 2),
  ('Responsible model delivery', 'Model packaging', 45, 1),
  ('Responsible model delivery', 'Responsible delivery review', 40, 2),
  ('AI concepts', 'Models and tasks', 35, 1),
  ('AI concepts', 'Capability exercise', 35, 2),
  ('Evaluation and safety', 'Quality and evaluation', 40, 1),
  ('Evaluation and safety', 'Safety review', 40, 2),
  ('AI application patterns', 'Application flow', 45, 1),
  ('AI application patterns', 'Reliability checklist', 35, 2),
  ('Security principles', 'Threats and assets', 40, 1),
  ('Security principles', 'Risk exercise', 40, 2),
  ('Application and network defense', 'Application controls', 45, 1),
  ('Application and network defense', 'Network controls', 45, 2),
  ('Incident awareness', 'Incident walkthrough', 40, 1),
  ('Incident awareness', 'Findings report', 35, 2),
  ('Cloud architecture', 'Cloud building blocks', 45, 1),
  ('Cloud architecture', 'Identity and networking', 45, 2),
  ('Containers and deployment', 'Container exercise', 45, 1),
  ('Containers and deployment', 'Deployment workflow', 45, 2),
  ('Operations and reliability', 'Observability basics', 40, 1),
  ('Operations and reliability', 'Reliability review', 40, 2)
) as lesson(module_title, title, duration_minutes, sequence_number)
on module.title = lesson.module_title
on conflict (module_id, sequence_number) do nothing;

-- The current schema supports assessment metadata but not question/answer
-- rows. These are catalogue definitions only; no learner attempts or scores
-- are created.
insert into public.assessments (title, description, skill_id, difficulty, total_questions)
select seed.title, seed.description, skill.id, seed.difficulty, seed.total_questions
from (values
  ('Python Foundations Check', 'Starter assessment covering Python syntax, functions, and data structures.', 'Python', 'beginner', 10),
  ('JavaScript Essentials Check', 'Starter assessment covering modern JavaScript and asynchronous code.', 'JavaScript', 'beginner', 10),
  ('React Foundations Check', 'Starter assessment covering components, props, state, and accessible UI.', 'React', 'intermediate', 10),
  ('SQL Querying Check', 'Starter assessment covering joins, aggregation, and relational reasoning.', 'SQL', 'beginner', 10),
  ('Data Structures Check', 'Starter assessment covering complexity and core data structures.', 'Data Structures', 'intermediate', 10),
  ('Machine Learning Foundations Check', 'Starter assessment covering data preparation, models, and evaluation.', 'Machine Learning', 'intermediate', 10),
  ('AI Fundamentals Check', 'Starter assessment covering AI capabilities, evaluation, and responsible use.', 'Artificial Intelligence', 'beginner', 10),
  ('Cybersecurity Foundations Check', 'Starter assessment covering threats, controls, and defensive practices.', 'Cybersecurity', 'beginner', 10)
) as seed(title, description, skill_name, difficulty, total_questions)
join public.skills skill on skill.name = seed.skill_name
where not exists (select 1 from public.assessments assessment where assessment.title = seed.title);

commit;
