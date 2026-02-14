// server/seed.js
import { connectDB } from "./src/config/db.js";

import User from "./src/models/User.js";
import Course from "./src/models/Course.js";
import Enrollment from "./src/models/Enrollment.js";
import Question from "./src/models/Question.js";
import Attempt from "./src/models/Attempt.js";
import Path from "./src/models/Path.js";
import Asset from "./src/models/Asset.js";

// -------------------- helpers --------------------
const now = () => new Date();
const pad2 = (n) => String(n).padStart(2, "0");

function makeId(prefix, ...parts) {
  // stable, readable IDs
  return `${prefix}-${parts.join("-")}`.toLowerCase().replace(/[^a-z0-9-]/g, "-");
}

function pick(arr, i) {
  return arr[i % arr.length];
}

// -------------------- dataset blueprint --------------------
const USERS = [
  { userId: "u-admin-01", name: "Admin", role: "admin", learning_style_preference: "mixed" },
  { userId: "u-emp-01", name: "Aarav Sharma", role: "employee", learning_style_preference: "video_first" },
  { userId: "u-emp-02", name: "Neha Patil", role: "employee", learning_style_preference: "doc_first" },
  { userId: "u-emp-03", name: "Rohan Verma", role: "employee", learning_style_preference: "mixed" },
];

const COURSES = [
  {
    courseId: "c-js-foundations",
    title: "JavaScript Foundations (Corporate Track)",
    description: "Core JavaScript concepts for real-world engineering tasks.",
    skillTags: ["javascript", "web", "frontend"],
    createdBy: "admin",
    topics: [
      {
        topic: "js-variables",
        label: "Variables & Types",
        docLinks: {
          beginner: "https://developer.mozilla.org/en-US/docs/Learn_web_development/Core/Scripting/Variables",
          intermediate: "https://developer.mozilla.org/en-US/docs/Web/JavaScript/Guide/Grammar_and_types",
          advanced: "https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Statements/var",
        },
        videoLinks: {
          beginner: "https://www.youtube.com/watch?v=PkZNo7MFNFg",
          intermediate: "https://www.youtube.com/watch?v=Ro89QLbBHQ0",
          advanced: "https://www.youtube.com/watch?v=jS4aFq5-91M",
        },
      },
      {
        topic: "js-arrays",
        label: "Arrays",
        docLinks: {
          beginner: "https://developer.mozilla.org/en-US/docs/Learn_web_development/Core/Scripting/Arrays",
          intermediate: "https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Array",
          advanced: "https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Array/of",
        },
        videoLinks: {
          beginner: "https://www.youtube.com/watch?v=PkZNo7MFNFg",
          intermediate: "https://www.youtube.com/watch?v=Ro89QLbBHQ0",
          advanced: "https://www.youtube.com/watch?v=jS4aFq5-91M",
        },
      },
      {
        topic: "js-functions",
        label: "Functions",
        docLinks: {
          beginner: "https://developer.mozilla.org/en-US/docs/Web/JavaScript/Guide/Functions",
          intermediate: "https://www.freecodecamp.org/news/javascript-functions-and-scope/",
          advanced: "https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Functions",
        },
        videoLinks: {
          beginner: "https://www.youtube.com/watch?v=PkZNo7MFNFg",
          intermediate: "https://www.youtube.com/watch?v=Ro89QLbBHQ0",
          advanced: "https://www.youtube.com/watch?v=jS4aFq5-91M",
        },
      },
    ],
  },
  {
    courseId: "c-python-controlflow",
    title: "Python Control Flow (Corporate Track)",
    description: "Write predictable, readable Python with decisions and loops.",
    skillTags: ["python", "backend", "automation"],
    createdBy: "admin",
    topics: [
      {
        topic: "py-control-flow",
        label: "Decisions (if/elif/else)",
        docLinks: {
          beginner: "https://docs.python.org/3/tutorial/controlflow.html",
          intermediate: "https://docs.python.org/3/tutorial/controlflow.html",
          advanced: "https://docs.python.org/3/tutorial/controlflow.html",
        },
        videoLinks: {
          beginner: "https://www.youtube.com/watch?v=pvZ98Zcl0V4",
          intermediate: "https://www.youtube.com/watch?v=9XbeXpKMR_E",
          advanced: "https://www.youtube.com/watch?v=NwjkG3htcsg",
        },
      },
      {
        topic: "py-loops",
        label: "Loops (for/while)",
        docLinks: {
          beginner: "https://docs.python.org/3/tutorial/controlflow.html",
          intermediate: "https://docs.python.org/3/tutorial/controlflow.html",
          advanced: "https://docs.python.org/3/tutorial/controlflow.html",
        },
        videoLinks: {
          beginner: "https://www.youtube.com/watch?v=pvZ98Zcl0V4",
          intermediate: "https://www.youtube.com/watch?v=9XbeXpKMR_E",
          advanced: "https://www.youtube.com/watch?v=NwjkG3htcsg",
        },
      },
      {
        topic: "py-functions",
        label: "Functions",
        docLinks: {
          beginner: "https://docs.python.org/3/tutorial/controlflow.html",
          intermediate: "https://docs.python.org/3/tutorial/controlflow.html",
          advanced: "https://docs.python.org/3/tutorial/controlflow.html",
        },
        videoLinks: {
          beginner: "https://www.youtube.com/watch?v=MtnrhVogFAA",
          intermediate: "https://www.youtube.com/watch?v=MtnrhVogFAA",
          advanced: "https://www.youtube.com/watch?v=MtnrhVogFAA",
        },
      },
    ],
  },
  {
    courseId: "c-git-github",
    title: "Git & GitHub Foundations (Corporate Track)",
    description: "Version control + collaboration workflows used in teams.",
    skillTags: ["git", "github", "collaboration"],
    createdBy: "admin",
    topics: [
      {
        topic: "git-basics",
        label: "Version Control Basics",
        docLinks: {
          beginner: "https://learn.microsoft.com/en-us/training/modules/intro-to-git/",
          intermediate: "https://learn.microsoft.com/en-us/training/modules/introduction-to-github/",
          advanced: "https://learn.microsoft.com/en-us/training/paths/github-foundations/",
        },
        videoLinks: {
          beginner: "https://www.youtube.com/watch?v=RGOj5yH7evk",
          intermediate: "https://www.youtube.com/watch?v=SWYqp7iY_Tc",
          advanced: "https://www.youtube.com/watch?v=2ReR1YJrNOM",
        },
      },
      {
        topic: "git-branches",
        label: "Branching & Merging",
        docLinks: {
          beginner: "https://docs.github.com/articles/about-branches",
          intermediate: "https://git-scm.com/book/en/v2/Git-Branching-Basic-Branching-and-Merging",
          advanced: "https://git-scm.com/docs/git-merge",
        },
        videoLinks: {
          beginner: "https://www.youtube.com/watch?v=RGOj5yH7evk",
          intermediate: "https://www.youtube.com/watch?v=SWYqp7iY_Tc",
          advanced: "https://www.youtube.com/watch?v=2ReR1YJrNOM",
        },
      },
      {
        topic: "github-prs",
        label: "Pull Requests & Review",
        docLinks: {
          beginner: "https://docs.github.com/en/pull-requests",
          intermediate: "https://docs.github.com/pull-requests/collaborating-with-pull-requests/proposing-changes-to-your-work-with-pull-requests/about-pull-requests",
          advanced: "https://docs.github.com/en/pull-requests",
        },
        videoLinks: {
          beginner: "https://www.youtube.com/watch?v=RGOj5yH7evk",
          intermediate: "https://www.youtube.com/watch?v=SWYqp7iY_Tc",
          advanced: "https://www.youtube.com/watch?v=2ReR1YJrNOM",
        },
      },
    ],
  },
];

// -------------------- builders --------------------
function buildAssetsFromCourses(courses) {
  const assets = [];

  for (const course of courses) {
    for (const t of course.topics) {
      const levels = [
        { level: "beginner", difficulty: 1, expectedTimeMin: 12 },
        { level: "intermediate", difficulty: 2, expectedTimeMin: 18 },
        { level: "advanced", difficulty: 3, expectedTimeMin: 25 },
      ];

      for (const lv of levels) {
        // doc
        assets.push({
          assetId: makeId("asset", course.courseId, t.topic, lv.level, "doc"),
          title: `${course.title}: ${t.label} (${lv.level}) — Documentation`,
          topic: t.topic,
          format: "doc",
          difficulty: lv.difficulty,
          level: lv.level,
          prerequisites: [],
          expectedTimeMin: lv.expectedTimeMin,
          url: t.docLinks[lv.level],
        });

        // video
        assets.push({
          assetId: makeId("asset", course.courseId, t.topic, lv.level, "video"),
          title: `${course.title}: ${t.label} (${lv.level}) — Video`,
          topic: t.topic,
          format: "video",
          difficulty: lv.difficulty,
          level: lv.level,
          prerequisites: [],
          expectedTimeMin: lv.expectedTimeMin,
          url: t.videoLinks[lv.level],
        });
      }
    }
  }

  return assets;
}

function buildQuestionsFromCourses(courses, perTopic = 15) {
  const questions = [];
  let qCounter = 1;

  for (const course of courses) {
    for (const t of course.topics) {
      for (let i = 0; i < perTopic; i++) {
        const diff = 1 + (i % 3); // 1..3
        const qid = makeId("q", course.courseId, t.topic, pad2(i + 1));

        // Create original prompts (not copied) but realistic
        const templates = [
          {
            prompt: `In ${t.label}, what is the main purpose of this concept?`,
            options: [
              "To store or organize data for later use",
              "To speed up the internet connection",
              "To encrypt a database automatically",
              "To replace the operating system",
            ],
            correctIndex: 0,
            explanation: "This is the core purpose in most beginner use-cases.",
          },
          {
            prompt: `Which option is the safest best-practice in ${t.label} for readable code?`,
            options: [
              "Use clear names and keep logic simple",
              "Avoid whitespace completely",
              "Write everything on one line",
              "Use random naming to hide logic",
            ],
            correctIndex: 0,
            explanation: "Readability and clarity are best-practices across teams.",
          },
          {
            prompt: `If a teammate struggles with ${t.label}, what is a good next step?`,
            options: [
              "Switch to an easier explanation and try again",
              "Skip the topic permanently",
              "Force only advanced content",
              "Remove all practice",
            ],
            correctIndex: 0,
            explanation: "Remediation should reduce difficulty and change presentation.",
          },
          {
            prompt: `In ${t.label}, which scenario usually indicates you should use this feature?`,
            options: [
              "When you need repeated or structured steps",
              "When you want to avoid learning basics",
              "When you need to delete the compiler",
              "When you want random program output",
            ],
            correctIndex: 0,
            explanation: "These concepts exist to solve common structured programming needs.",
          },
          {
            prompt: `Choose the most accurate statement about ${t.label}.`,
            options: [
              "It helps you build predictable programs",
              "It makes code run without a CPU",
              "It replaces all debugging tools",
              "It is only used in games",
            ],
            correctIndex: 0,
            explanation: "These are foundational skills for predictable outcomes.",
          },
        ];

        const base = pick(templates, i);

        questions.push({
          questionId: qid,
          topic: t.topic,
          difficulty: diff,
          prompt: base.prompt + ` (Difficulty ${diff})`,
          options: base.options,
          correctIndex: base.correctIndex,
          explanation: base.explanation,
        });

        qCounter++;
      }
    }
  }

  return questions;
}

function buildCoursesWithModules(courses, assets) {
  // Attach moduleAssetIds to each course: order by topics and by level/doc/video
  const updatedCourses = [];

  for (const course of courses) {
    const moduleAssetIds = [];
    for (const t of course.topics) {
      const order = [
        ["beginner", "doc"],
        ["beginner", "video"],
        ["intermediate", "doc"],
        ["intermediate", "video"],
        ["advanced", "doc"],
        ["advanced", "video"],
      ];
      for (const [lv, fmt] of order) {
        moduleAssetIds.push(makeId("asset", course.courseId, t.topic, lv, fmt));
      }
    }

    updatedCourses.push({
      courseId: course.courseId,
      title: course.title,
      description: course.description,
      skillTags: course.skillTags,
      moduleAssetIds,
      createdBy: course.createdBy,
      active: true,
    });
  }

  return updatedCourses;
}

function buildEnrollments(users, courses) {
  const enrollments = [];
  let e = 1;

  // enroll every user into every course (easy testing)
  for (const u of users) {
    for (const c of courses) {
      enrollments.push({
        enrollmentId: makeId("enr", pad2(e++), u.userId, c.courseId),
        userId: u.userId,
        courseId: c.courseId,
        status: "active",
        enrolledAt: now(),
        targetPace: 30, // min/day
      });
    }
  }

  return enrollments;
}

function buildPaths(users, courses) {
  const paths = [];
  let p = 1;

  for (const u of users) {
    for (const c of courses) {
      const nodes = c.moduleAssetIds.map((assetId) => ({
        assetId,
        status: "pending",
        addedBy: "engine",
      }));

      paths.push({
        pathId: makeId("path", pad2(p++), u.userId, c.courseId),
        userId: u.userId,
        courseId: c.courseId,
        nodes,
        currentIndex: 0,
        nextAssetId: nodes[0]?.assetId,
        lastUpdatedReason: "Initial path created from course modules.",
        etaMinutes: nodes.length * 15,
        updatedAt: now(),
      });
    }
  }

  return paths;
}

function buildAttempts(users, courses) {
  // Create a few attempts to test:
  // - low score (<60) => engine picks easier + different format
  // - high score (>90) => engine jumps to advanced
  const attempts = [];
  let a = 1;

  // Helper: pick one topic per course (first topic)
  for (const u of users) {
    for (const c of courses) {
      const firstAsset = c.moduleAssetIds[0]; // beginner doc of first topic
      const topic = COURSES.find((x) => x.courseId === c.courseId).topics[0].topic;

      const low = u.userId === "u-emp-03"; // make Rohan the "struggler"
      const high = u.userId === "u-emp-01"; // make Aarav the "breezer"

      if (low) {
        attempts.push({
          attemptId: makeId("att", pad2(a++), u.userId, c.courseId, "low"),
          userId: u.userId,
          courseId: c.courseId,
          pathId: makeId("path", pad2(courses.indexOf(c) + 1), u.userId, c.courseId), // not relied on heavily
          assetId: firstAsset,
          topic,
          format: "doc",
          assetDifficulty: 1,
          timeSpentMin: 20,
          timeRatio: 20 / 12,
          askedQuestionIds: [],
          wrongQuestionIds: ["seed-wrong-1", "seed-wrong-2"],
          score: 55,
          attemptNo: 1,
          createdAt: now(),
        });
      }

      if (high) {
        attempts.push({
          attemptId: makeId("att", pad2(a++), u.userId, c.courseId, "high"),
          userId: u.userId,
          courseId: c.courseId,
          pathId: makeId("path", pad2(courses.indexOf(c) + 1), u.userId, c.courseId),
          assetId: firstAsset,
          topic,
          format: "doc",
          assetDifficulty: 1,
          timeSpentMin: 8,
          timeRatio: 8 / 12,
          askedQuestionIds: [],
          wrongQuestionIds: [],
          score: 95,
          attemptNo: 1,
          createdAt: now(),
        });
      }
    }
  }

  return attempts;
}

// -------------------- seed runner --------------------
async function seed() {
  try {
    await connectDB();

    console.log("Clearing existing data...");
    await Promise.all([
      User.deleteMany({}),
      Course.deleteMany({}),
      Enrollment.deleteMany({}),
      Question.deleteMany({}),
      Attempt.deleteMany({}),
      Path.deleteMany({}),
      Asset.deleteMany({}),
    ]);

    console.log("Building fresh dataset...");
    const assets = buildAssetsFromCourses(COURSES);
    const coursesWithModules = buildCoursesWithModules(COURSES, assets);
    const questions = buildQuestionsFromCourses(COURSES, 15);
    const enrollments = buildEnrollments(USERS, coursesWithModules);
    const paths = buildPaths(USERS, coursesWithModules);
    const attempts = buildAttempts(USERS, coursesWithModules);

    console.log("Seeding Users...");
    await User.insertMany(USERS);
    console.log(`✓ ${USERS.length} users inserted`);

    console.log("Seeding Assets...");
    await Asset.insertMany(assets);
    console.log(`✓ ${assets.length} assets inserted`);

    console.log("Seeding Courses...");
    await Course.insertMany(coursesWithModules);
    console.log(`✓ ${coursesWithModules.length} courses inserted`);

    console.log("Seeding Enrollments...");
    await Enrollment.insertMany(enrollments);
    console.log(`✓ ${enrollments.length} enrollments inserted`);

    console.log("Seeding Paths...");
    await Path.insertMany(paths);
    console.log(`✓ ${paths.length} paths inserted`);

    console.log("Seeding Questions...");
    await Question.insertMany(questions);
    console.log(`✓ ${questions.length} questions inserted`);

    console.log("Seeding Attempts...");
    await Attempt.insertMany(attempts);
    console.log(`✓ ${attempts.length} attempts inserted`);

    console.log("\n✓ Database seeded successfully!");
    process.exit(0);
  } catch (err) {
    console.error("✗ Seed failed:", err);
    process.exit(1);
  }
}

seed();
