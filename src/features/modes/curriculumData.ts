/**
 * ARTISTRY AI — Structured Traditional Drawing Curriculum
 * Complete 7-Level pedagogical curriculum for complete beginners starting from zero.
 * Contains 39 comprehensive lessons with step-by-step instructions, visual explanations,
 * practice activities, and completion criteria.
 */

import type { CurriculumLevel, CurriculumLesson, CommonMistake } from "./types";

const BASE_CURRICULUM: CurriculumLevel[] = [
  // =========================================================================
  // LEVEL 1: DRAWING FUNDAMENTALS
  // =========================================================================
  {
    level: 1,
    title: "Level 1 – Drawing Fundamentals",
    subtitle: "Pencil Control, Lines & Basic Shapes",
    description: "Start from absolute zero. Learn how to hold drawing tools, move from the shoulder, and execute clean, confident strokes.",
    icon: "✏️",
    lessons: [
      {
        id: "l1-01",
        level: 1,
        lessonNumber: 1,
        title: "Understanding Drawing Materials",
        subtitle: "Graphite Grades, Erasers & Paper Surfaces",
        category: "fundamentals",
        estimatedMinutes: 10,
        objective: "Understand how graphite hardness (9H to 9B) and paper surfaces affect line quality and tone.",
        explanation: "Drawing pencils range from hard ('H') which produce light, crisp lines to soft ('B') which produce rich, dark tones. HB sits right in the middle as standard handwriting graphite. Traditional artists use 2H for light construction guides, HB for block-in outlines, and 2B–6B for deep shadows.",
        visualDemonstration: "A tonal progression strip from hard 2H (light grey) through HB, 2B, 4B to 6B (deep velvet black).",
        steps: [
          {
            stepNumber: 1,
            title: "Inspect the Graphite Scale",
            instruction: "Look at your drawing pencils. 'H' stands for Hardness (more clay, less graphite). 'B' stands for Blackness (more graphite, less clay).",
            tip: "Never press hard with an H pencil to make it darker; it will groove your paper. Switch to a B pencil instead.",
            diagramType: "lines",
          },
          {
            stepNumber: 2,
            title: "Explore Paper Tooth",
            instruction: "Paper has texture called 'tooth'. Smooth (hot press) paper allows ultra-fine detail, while medium (cold press) paper grabs graphite for rich values.",
            tip: "For foundational practice, standard 80–120 gsm drawing paper is ideal.",
          },
          {
            stepNumber: 3,
            title: "Understand Erasers as Drawing Tools",
            instruction: "Kneaded erasers are not just for fixing mistakes; you can mold them into fine points to lift out highlights and reflected light.",
            tip: "Dab with a kneaded eraser rather than scrubbing across the paper.",
          },
        ],
        practiceActivity: "Draw three vertical gradient bands in your sketchbook or on the canvas: one with light pressure, one with medium pressure, and one with firm pressure.",
        completionCriteria: "You can identify the difference between H and B graphite grades and understand why construction lines should always be drawn lightly.",
      },
      {
        id: "l1-02",
        level: 1,
        lessonNumber: 2,
        title: "Holding a Pencil for Traditional Drawing",
        subtitle: "Tripod Grip vs. Overhand Grip",
        category: "fundamentals",
        estimatedMinutes: 12,
        objective: "Master the overhand grip for loose arm movement and the tripod grip for precision details.",
        explanation: "Writing forces your fingers and wrist into a tight tripod grip. Drawing requires motion from your entire arm—wrist, elbow, and shoulder. The overhand grip allows you to use the side of the graphite lead for wide tone blocks and sweeping construction lines without straining your wrist.",
        visualDemonstration: "Comparison of the handwriting tripod grip (confined wrist motion) versus the overhand grip (free shoulder rotation).",
        steps: [
          {
            stepNumber: 1,
            title: "The Writing Tripod Grip",
            instruction: "Hold the pencil between your thumb and index finger, resting on the middle finger. Use this grip strictly for minute details and crisp signatures.",
            tip: "Notice how your hand blocks your view of the paper in this grip.",
            diagramType: "lines",
          },
          {
            stepNumber: 2,
            title: "The Overhand Artist Grip",
            instruction: "Place your pencil flat on a table. Pick it up from above with your thumb on one side and your fingers curled gently over the barrel. Your palm faces the paper.",
            tip: "This grip lets you see the whole drawing surface without your hand obstructing the line.",
          },
          {
            stepNumber: 3,
            title: "Drawing from the Shoulder",
            instruction: "Lock your wrist and elbow gently. Swing your arm from your shoulder joint to draw long, sweeping arcs across the canvas.",
            tip: "Shoulder movement produces straight, confident lines without unwanted wobbles.",
          },
        ],
        practiceActivity: "Using the overhand grip and your shoulder, draw 15 loose, full-arm horizontal lines from left to right without bending your wrist.",
        completionCriteria: "You can hold the pencil using the overhand grip and move your arm comfortably from the shoulder joint.",
      },
      {
        id: "l1-03",
        level: 1,
        lessonNumber: 3,
        title: "Basic Lines & Ghosting Technique",
        subtitle: "Straight Lines, Curved Lines & Ghosting",
        category: "fundamentals",
        estimatedMinutes: 15,
        objective: "Eliminate hesitant 'hairy' lines and execute smooth, confident strokes using the ghosting method.",
        explanation: "Beginners often draw with timid, repeated short strokes ('chicken scratching'). Professional artists practice 'ghosting': rehearsing the stroke in the air 2–3 times over the start and end points before making contact. When the pencil touches the surface, commit to a single deliberate stroke.",
        visualDemonstration: "Dotted alignment points with an air-ghosted trajectory leading to a single crisp continuous line.",
        steps: [
          {
            stepNumber: 1,
            title: "Place Two Anchor Points",
            instruction: "Place point A on the left side of the canvas and point B on the right side, about 10 cm apart.",
            diagramType: "lines",
          },
          {
            stepNumber: 2,
            title: "Ghost the Trajectory",
            instruction: "Hold your pencil 1 mm above point A. Move your pencil toward point B in the air without touching the surface. Repeat this rehearsal motion 2 to 3 times.",
            tip: "Look at your target point B while moving, not at the pencil tip.",
          },
          {
            stepNumber: 3,
            title: "Execute the Single Stroke",
            instruction: "On the third rehearsal swing, lower the pencil smoothly onto point A and sweep cleanly through point B in one swift motion.",
            tip: "Speed creates straightness. Do not slow down to steer the pencil.",
          },
        ],
        practiceActivity: "Scatter 10 pairs of random dots on a canvas and connect each pair with a single ghosted straight stroke.",
        completionCriteria: "At least 8 out of 10 line pairs are straight and drawn with a single continuous stroke without scratching.",
      },
      {
        id: "l1-04",
        level: 1,
        lessonNumber: 4,
        title: "Circles and Ellipses",
        subtitle: "Freehand Circles, Axes & Roundness",
        category: "fundamentals",
        estimatedMinutes: 15,
        objective: "Draw round circles and symmetric ellipses without tracing templates or compasses.",
        explanation: "Every cylinder, sphere, glass, wheel, and head construction begins with an ellipse. An ellipse is a circle viewed at an angle. It has two symmetric axes: a major axis (the longest diameter) and a minor axis (the shortest diameter, perpendicular to the major axis).",
        visualDemonstration: "A circle inscribed inside an axis crosshair expanding into a tilted ellipse with major and minor axes.",
        steps: [
          {
            stepNumber: 1,
            title: "The Ghosted Circular Orbit",
            instruction: "Hover your pencil over the paper and spin your arm from the elbow and shoulder in a continuous circular orbit. Let your hand find the natural circular rhythm.",
            diagramType: "sphere",
          },
          {
            stepNumber: 2,
            title: "Light Contact Circle",
            instruction: "Lower the pencil lightly onto the surface while maintaining the orbit. Trace 2–3 overlapping faint loops, then darken the most accurate path.",
            tip: "Do not attempt a perfect circle in a single slow stroke; build it through orbital rotation.",
          },
          {
            stepNumber: 3,
            title: "Constructing Ellipses with Axes",
            instruction: "Draw an upright '+' cross. The horizontal bar is the major axis; the vertical bar is the minor axis. Draw round curved caps at the ends—never sharp football points.",
            tip: "The curve of an ellipse must stay round at both ends; avoid pointy corners.",
          },
        ],
        practiceActivity: "Draw 8 freehand circles of varying sizes, followed by 8 ellipses flattening gradually from wide to thin.",
        completionCriteria: "Your ellipses have rounded ends and are symmetrical across both major and minor axes.",
      },
      {
        id: "l1-05",
        level: 1,
        lessonNumber: 5,
        title: "Basic Geometric Shapes",
        subtitle: "Squares, Rectangles, Triangles & Polygons",
        category: "fundamentals",
        estimatedMinutes: 15,
        objective: "Accurately construct 2D geometric shapes with parallel edges and perpendicular corners.",
        explanation: "All complex real-world objects can be broken down into fundamental 2D shapes: rectangles, triangles, circles, and polygons. Mastering accurate right angles, parallel lines, and corner connections gives your drawings solid structural integrity.",
        visualDemonstration: "A grid of squares, golden rectangles, equilateral triangles, and polygons with corner alignment markers.",
        steps: [
          {
            stepNumber: 1,
            title: "Constructing a True Square",
            instruction: "Draw a horizontal baseline. From both ends, drop perpendicular vertical lines of equal length. Connect the tops with a parallel line.",
            diagramType: "shapes",
          },
          {
            stepNumber: 2,
            title: "Triangles & Equal Sides",
            instruction: "Draw a horizontal base. Find the midpoint, extend a vertical centerline upward, and connect the apex to both bottom corners to form an isosceles triangle.",
          },
          {
            stepNumber: 3,
            title: "Combining Shapes into Silhouettes",
            instruction: "Combine a square, a triangle, and an ellipse together to form a simple silhouette (such as a house, a bottle, or an arrow).",
          },
        ],
        practiceActivity: "Draw a composition combining 3 squares, 2 triangles, and 2 ellipses overlapping neatly.",
        completionCriteria: "All edges are straight and parallel lines do not accidentally converge.",
      },
      {
        id: "l1-06",
        level: 1,
        lessonNumber: 6,
        title: "Line Control & Hatching Exercises",
        subtitle: "Uniform Spacing, Pressure & Clean Cross-Hatching",
        category: "fundamentals",
        estimatedMinutes: 20,
        objective: "Control pencil pressure, execute uniform parallel hatching lines, and cross-hatch cleanly.",
        explanation: "Hatching is the traditional technique of building value and shadow using closely spaced parallel lines. Cross-hatching layers a second set of parallel lines at an angle over the first. The lines must be evenly spaced and terminate crisply without hooks or tails.",
        visualDemonstration: "A 4-step hatching value strip: single parallel hatching, dense hatching, cross-hatching at 30°, and triple-layered hatching.",
        steps: [
          {
            stepNumber: 1,
            title: "Single-Direction Parallel Hatching",
            instruction: "Draw a 5x5 cm square. Fill it with diagonal hatching lines tilted at 45 degrees, keeping exactly 2 mm between each line.",
            tip: "Lift the pencil cleanly at the end of each stroke; avoid zig-zag back-and-forth scribbling.",
            diagramType: "lines",
          },
          {
            stepNumber: 2,
            title: "Cross-Hatching Layering",
            instruction: "Over your first layer of hatching, add a second layer at a gentle 30-degree angle to create a richer, darker midtone.",
            tip: "Never cross lines at a harsh 90-degree right angle; a gentle angle (30° to 45°) creates more natural tone.",
          },
          {
            stepNumber: 3,
            title: "Pressure Transition Gradient",
            instruction: "Draw a continuous hatch line starting with whisper-light pressure and gradually pressing firmer to create a smooth dark gradient.",
          },
        ],
        practiceActivity: "Create a 5-step value bar using only hatching and cross-hatching, progressing smoothly from 10% grey to 90% black.",
        completionCriteria: "Lines remain uniformly spaced and individual strokes do not curve unexpectedly at their endpoints.",
      },
    ],
  },

  // =========================================================================
  // LEVEL 2: SHAPES AND FORMS
  // =========================================================================
  {
    level: 2,
    title: "Level 2 – Shapes and Forms",
    subtitle: "Transforming 2D Flat Shapes into 3D Solid Forms",
    description: "Learn the secret of 3D drawing: turning flat shapes (squares, circles, triangles) into voluminous forms (cubes, spheres, cylinders, cones).",
    icon: "📦",
    lessons: [
      {
        id: "l2-01",
        level: 2,
        lessonNumber: 1,
        title: "2D Flat Shapes vs. 3D Volumetric Forms",
        subtitle: "Understanding Depth, Overlap & Planes",
        category: "shapes",
        estimatedMinutes: 12,
        objective: "Understand the visual cues that create the illusion of three-dimensional depth on a flat 2D page.",
        explanation: "A shape has only width and height (2D). A form has width, height, and depth (3D). The human eye perceives depth through three visual cues: overlap (one object blocking another), convergence (lines angling into the distance), and form shading (light transitioning across curved or angled surfaces).",
        visualDemonstration: "Flat circle next to a 3D shaded sphere with cast shadow, and flat square next to an isometric cube.",
        steps: [
          {
            stepNumber: 1,
            title: "The Overlap Principle",
            instruction: "Draw two overlapping circles. By erasing the hidden line where the front circle covers the back, the brain immediately perceives depth.",
            diagramType: "shapes",
          },
          {
            stepNumber: 2,
            title: "The Cross-Contour Principle",
            instruction: "Draw a circle. Now draw curved equator lines across it like a basketball. The curved cross-contour lines instantly give it 3D roundness.",
          },
          {
            stepNumber: 3,
            title: "Top, Front, and Side Planes",
            instruction: "Every 3D form can be broken down into three primary planes facing different directions in space: top, front, and side.",
          },
        ],
        practiceActivity: "Draw 3 overlapping geometric forms (a cube behind a cylinder, in front of a sphere).",
        completionCriteria: "The spatial depth hierarchy is clear through clean line overlaps without ambiguity.",
      },
      {
        id: "l2-02",
        level: 2,
        lessonNumber: 2,
        title: "Cube Construction & Perspective Basics",
        subtitle: "Constructing Boxes with Converging Planes",
        category: "shapes",
        estimatedMinutes: 18,
        objective: "Construct solid cubes and boxes from multiple vantage points without warping.",
        explanation: "The cube is the king of all drawing forms. Once you can construct a cube in any orientation, you can box in any object—furniture, cars, buildings, and even human heads (as in the Loomis and Bargue methods).",
        visualDemonstration: "A 3D cube drawn with transparent 'see-through' wireframe lines showing all 6 faces and 8 corners.",
        steps: [
          {
            stepNumber: 1,
            title: "Draw the Front Face",
            instruction: "Draw a square or rectangle representing the front face of the box.",
            diagramType: "cube",
          },
          {
            stepNumber: 2,
            title: "Project Depth Lines (Y-Axes)",
            instruction: "From the three visible corners, project parallel diagonal lines upward and backward at a 45-degree angle.",
            tip: "Keep all three projection lines the exact same length and angle.",
          },
          {
            stepNumber: 3,
            title: "Cap the Top and Side Faces",
            instruction: "Connect the ends of the depth lines with lines parallel to your front square edges.",
            tip: "Draw through the form like glass to check where the hidden back corners sit.",
          },
        ],
        practiceActivity: "Draw 5 cubes from different viewpoints: looking from above, level eye, and looking from below.",
        completionCriteria: "Opposite edges remain parallel or slightly converge into the distance without diverging outward.",
      },
      {
        id: "l2-03",
        level: 2,
        lessonNumber: 3,
        title: "Sphere Construction & Cross-Contours",
        subtitle: "Drawing Solid Balls with Curved Latitudes",
        category: "shapes",
        estimatedMinutes: 15,
        objective: "Turn a flat circle into a solid 3D sphere using cross-contour latitude and longitude curves.",
        explanation: "A circle is completely flat until you wrap cross-contour lines around its volume. Just like globes have lines of latitude and longitude, drawing spherical cross-contours establishes the sphere's orientation in 3D space, which is the foundational step of the Loomis head method.",
        visualDemonstration: "A circle with an elliptical equator tilted down, and a vertical meridian curve running from pole to pole.",
        steps: [
          {
            stepNumber: 1,
            title: "Draw the Outer Cranial Circle",
            instruction: "Draw a clean, freehand circle using your ghosting technique.",
            diagramType: "sphere",
          },
          {
            stepNumber: 2,
            title: "Add the Equator Ellipse",
            instruction: "Draw an ellipse across the center of the sphere. If the sphere is viewed from above, the front of the ellipse dips downward.",
            tip: "The curvature of this ellipse dictates the upward or downward pitch of the form.",
          },
          {
            stepNumber: 3,
            title: "Add the Vertical Meridian",
            instruction: "Draw a curved line connecting the north pole to the south pole, crossing perpendicular to your equator.",
          },
        ],
        practiceActivity: "Draw 4 spheres with equators tilted in different directions: looking up, looking down, turned left, and turned right.",
        completionCriteria: "The cross-contour ellipses curve naturally and give the sphere immediate 3D volume.",
        recommendedOverlay: "loomis",
      },
      {
        id: "l2-04",
        level: 2,
        lessonNumber: 4,
        title: "Cylinder Construction",
        subtitle: "Connecting Parallel Ellipses in Space",
        category: "shapes",
        estimatedMinutes: 15,
        objective: "Construct upright and horizontal cylinders with correctly curving elliptical end caps.",
        explanation: "A cylinder is composed of two parallel circular faces connected by parallel side lines. In perspective, the ellipse further away from your eye appears rounder and fuller than the ellipse closer to your eye. Understanding cylinders is essential for drawing arms, legs, fingers, and bottles.",
        visualDemonstration: "A transparent cylinder showing the flat near ellipse and rounder far ellipse connected by tangent lines.",
        steps: [
          {
            stepNumber: 1,
            title: "Draw the Central Axis",
            instruction: "Draw a straight centerline representing the cylinder's core spine.",
            diagramType: "cylinder",
          },
          {
            stepNumber: 2,
            title: "Construct the Near Ellipse",
            instruction: "Draw an ellipse centered on the axis. The major axis of the ellipse must be strictly perpendicular (90°) to the cylinder's spine.",
            tip: "Never tilt the major axis away from 90° relative to the spine.",
          },
          {
            stepNumber: 3,
            title: "Draw Parallel Tangents and Far Ellipse",
            instruction: "Connect the widest points of the top ellipse with straight lines down to the base. Make the bottom ellipse slightly rounder than the top one.",
          },
        ],
        practiceActivity: "Draw 3 cylinders: one standing upright, one lying flat pointing toward you, and one tilted diagonally.",
        completionCriteria: "Both ellipses have rounded sides and the far ellipse is slightly fuller than the near ellipse.",
      },
      {
        id: "l2-05",
        level: 2,
        lessonNumber: 5,
        title: "Cone Construction",
        subtitle: "Apex Points, Central Axes & Elliptical Bases",
        category: "shapes",
        estimatedMinutes: 12,
        objective: "Construct symmetrical cones with accurate base curvature from any angle.",
        explanation: "Cones taper from an apex point down to an elliptical base. They are common in anatomy (noses, fingers tapering) and natural objects (trees, mountains, funnels).",
        visualDemonstration: "A vertical axis line with an apex dot at the top and an elliptical base at the bottom with tangent lines.",
        steps: [
          {
            stepNumber: 1,
            title: "Establish Apex and Centerline",
            instruction: "Mark an apex point at the top and drop a vertical centerline down to the ground.",
            diagramType: "cone",
          },
          {
            stepNumber: 2,
            title: "Draw the Elliptical Base",
            instruction: "Draw an ellipse centered horizontally on the bottom of the axis line.",
          },
          {
            stepNumber: 3,
            title: "Connect the Tangent Edges",
            instruction: "From the apex point, draw straight lines down to the outer left and right edges of the elliptical base.",
          },
        ],
        practiceActivity: "Draw 4 cones: upright, upside down (ice cream cone), and two cones pointing sideways.",
        completionCriteria: "The apex sits directly above the center of the base ellipse and the tangent lines touch the widest points.",
      },
      {
        id: "l2-06",
        level: 2,
        lessonNumber: 6,
        title: "Light & Shadow on Basic Forms",
        subtitle: "Light Source, Form Shadow & Cast Shadow",
        category: "shapes",
        estimatedMinutes: 20,
        objective: "Understand how a single directional light source creates form shadows and cast shadows on cubes and spheres.",
        explanation: "When light hits a 3D form, it divides the object into two distinct worlds: the LIGHT SIDE and the SHADOW SIDE. The boundary where light can no longer reach the surface is called the TERMINATOR. Additionally, the form blocks light from hitting the ground, creating a CAST SHADOW.",
        visualDemonstration: "A sphere illuminated from the upper-left (45°) showing the highlight, midtone, terminator line, core shadow, reflected light, and dark cast shadow.",
        steps: [
          {
            stepNumber: 1,
            title: "Establish Light Direction",
            instruction: "Place a small sun symbol in the upper left corner. Draw a straight line from the sun to the top edge of your object to define the light angle.",
            diagramType: "shading",
          },
          {
            stepNumber: 2,
            title: "Find the Terminator Line",
            instruction: "Draw the line across the form where light rays can no longer reach. Everything on the opposite side falls completely into shadow.",
            tip: "Keep the shadow side clearly distinct from the light side.",
          },
          {
            stepNumber: 3,
            title: "Project the Cast Shadow on the Ground",
            instruction: "From the base of the object, project a dark silhouette on the table surface in the opposite direction of the light.",
            tip: "The cast shadow is darkest right where the object touches the ground (contact shadow).",
          },
        ],
        practiceActivity: "Draw a cube and a sphere side by side on a table, and shade both from a single light source coming from the top-right.",
        completionCriteria: "The shadow sides of both objects correspond correctly to the same light direction.",
        recommendedOverlay: "shading",
      },
    ],
  },

  // =========================================================================
  // LEVEL 3: PROPORTION AND OBSERVATION
  // =========================================================================
  {
    level: 3,
    title: "Level 3 – Proportion and Observation",
    subtitle: "Measuring, Comparative Sight-Size & Academic Block-In",
    description: "Learn how classical masters measure subjects accurately without rulers: comparative sighting, negative space, plumb lines, and Charles Bargue's block-in envelope.",
    icon: "📐",
    lessons: [
      {
        id: "l3-01",
        level: 3,
        lessonNumber: 1,
        title: "Understanding Proportions in Art",
        subtitle: "Ratios, Width-to-Height & Scaling",
        category: "observation",
        estimatedMinutes: 15,
        objective: "Understand how proportions define likeness and prevent drawings from looking squished or stretched.",
        explanation: "Proportion is simply the comparative relationship of one part to another in terms of size, width, and height. If a bottle is twice as tall as it is wide, your drawing must preserve that 2:1 ratio regardless of whether you draw it small in a sketchbook or large on a poster.",
        visualDemonstration: "A bounding rectangle displaying a 1:1.618 Golden Ratio and 2:1 width-to-height proportion grid.",
        steps: [
          {
            stepNumber: 1,
            title: "Establish a Unit of Measurement",
            instruction: "Pick the smallest salient feature of your subject (e.g. the width of a coffee mug, or the height of a head) as your 'unit of 1'.",
          },
          {
            stepNumber: 2,
            title: "Count Proportional Multiples",
            instruction: "Measure how many times your unit of 1 fits into the total height and total width of the subject.",
          },
          {
            stepNumber: 3,
            title: "Block In the Bounding Rectangle",
            instruction: "Before drawing any curves or details, draw a simple light box that matches that exact width-to-height ratio.",
          },
        ],
        practiceActivity: "Pick any object in your room (a cup, book, or phone) and determine its exact width-to-height ratio.",
        completionCriteria: "You can explain the width-to-height ratio of your chosen object and draw a matching bounding box.",
      },
      {
        id: "l3-02",
        level: 3,
        lessonNumber: 2,
        title: "Visual Measuring with a Pencil",
        subtitle: "The Classical Arm's-Length Sighting Method",
        category: "observation",
        estimatedMinutes: 15,
        objective: "Use a pencil held at locked arm's length as a sighting caliper to measure real-world subjects.",
        explanation: "This is the classical studio measuring technique. Hold your pencil vertically with your arm fully extended and your elbow locked. Close one eye. Slide your thumb along the pencil to match the width of a feature, then compare that measurement against other parts of your subject.",
        visualDemonstration: "An artist's hand holding a pencil at arm's length with thumb sliding to measure a classical bust.",
        steps: [
          {
            stepNumber: 1,
            title: "Lock Your Elbow Completely",
            instruction: "Never bend your elbow when measuring. If your arm bends even slightly, the pencil moves closer or further from your eye, destroying your measurement.",
            diagramType: "plumb",
          },
          {
            stepNumber: 2,
            title: "Close One Eye and Align Pencil Tip",
            instruction: "Close your non-dominant eye. Align the tip of the pencil with the top of the feature you want to measure.",
          },
          {
            stepNumber: 3,
            title: "Mark the Distance with Your Thumb",
            instruction: "Slide your thumb down the pencil barrel until it aligns with the bottom of the feature. That distance is your reference unit.",
          },
        ],
        practiceActivity: "Hold a pencil at arm's length and measure how many head-heights tall a person or chair in your room is.",
        completionCriteria: "You can execute the arm's-length measurement technique with locked elbow and consistent sighting.",
        recommendedOverlay: "measurement",
      },
      {
        id: "l3-03",
        level: 3,
        lessonNumber: 3,
        title: "Comparative Measurement in Studio",
        subtitle: "Using Calipers & Proportional Dividers",
        category: "observation",
        estimatedMinutes: 15,
        objective: "Apply comparative dividers on reference photos to verify proportions before rendering details.",
        explanation: "In ARTISTRY AI Reference Studio, the Sight-Size Calipers overlay replicates classical proportional dividers. You place one caliper across a reference landmark (e.g. eye width) and compare it against other landmarks (e.g. nose length or chin distance).",
        visualDemonstration: "Reference Studio Caliper overlay showing two measurement arms and a relative ratio readout (e.g. 1.0x vs 2.5x).",
        steps: [
          {
            stepNumber: 1,
            title: "Activate the Calipers Overlay",
            instruction: "In Reference Studio, open the Layer Drawer and add the Sight-Size Calipers overlay.",
          },
          {
            stepNumber: 2,
            title: "Place Base Caliper on Reference Feature",
            instruction: "Set caliper Point 1 and Point 2 across your primary unit (such as the distance between the eyes).",
          },
          {
            stepNumber: 3,
            title: "Compare Against Secondary Features",
            instruction: "Check if the nose length or mouth width equals 1 unit, 1.5 units, or 2 units.",
          },
        ],
        practiceActivity: "Open a portrait reference and measure how many eye-widths fit across the entire width of the face.",
        completionCriteria: "You can calculate and record comparative proportions using the Calipers overlay.",
        recommendedOverlay: "measurement",
      },
      {
        id: "l3-04",
        level: 3,
        lessonNumber: 4,
        title: "Negative Space Observation",
        subtitle: "Drawing the Empty Shapes Around the Subject",
        category: "observation",
        estimatedMinutes: 15,
        objective: "Detect contour mistakes by observing and drawing negative spaces instead of positive objects.",
        explanation: "Our brains have preconceived ideas about familiar objects (e.g., 'eyes look like almonds'), which causes drawing errors. Negative space is the air or empty space surrounding the object. Because your brain has no preconceived bias about the shape of empty air, observing negative space reveals exact contours instantly.",
        visualDemonstration: "A coffee mug with a handle, where the interior hole and surrounding background air are filled in solid black to highlight negative shapes.",
        steps: [
          {
            stepNumber: 1,
            title: "Shift Your Focus to the Empty Air",
            instruction: "Look at the space between the arm of a chair and its leg, or between an elbow and the torso. Ignore the limb completely.",
          },
          {
            stepNumber: 2,
            title: "Observe the Negative Shape Boundaries",
            instruction: "Is the empty space a tall triangle, a tilted crescent, or a trapezoid? Focus on drawing the exact shape of that air pocket.",
          },
          {
            stepNumber: 3,
            title: "Verify the Positive Contour",
            instruction: "Once the negative shape is drawn accurately, the positive object's contour falls automatically into place.",
          },
        ],
        practiceActivity: "Draw an ornate chair or scissors by drawing ONLY the negative background shapes surrounding the object.",
        completionCriteria: "The resulting silhouette matches the actual object accurately without measuring the object itself.",
      },
      {
        id: "l3-05",
        level: 3,
        lessonNumber: 5,
        title: "Plumb Lines & Vertical Alignments",
        subtitle: "True Vertical Gravity Lines for Accurate Anatomy",
        category: "observation",
        estimatedMinutes: 15,
        objective: "Drop true vertical plumb lines through key landmarks to verify horizontal positions across a drawing.",
        explanation: "A plumb line is a vertical line anchored by gravity. Classical masters drop mental plumb lines through key landmarks (e.g. 'If I drop a vertical plumb line from the inner corner of the eye, does it hit the corner of the mouth or the wing of the nostril?'). Plumb lines eliminate tilted, leaning drawings.",
        visualDemonstration: "A classical standing figure with vertical plumb lines dropped from the tear duct to the foot and horizontal level lines checking hips and shoulders.",
        steps: [
          {
            stepNumber: 1,
            title: "Drop a Plumb Line from the Highest Point",
            instruction: "Drop a true vertical line straight down from the apex of your subject through to the floor.",
            diagramType: "plumb",
          },
          {
            stepNumber: 2,
            title: "Check Cross-Feature Intersections",
            instruction: "Note which features lie to the left, which lie to the right, and which land directly on that vertical axis.",
          },
          {
            stepNumber: 3,
            title: "Check Horizontal Level Alignments",
            instruction: "Draw horizontal lines across the corners of the eyes, nostrils, lips, shoulders, and hips to ensure they tilt consistently.",
          },
        ],
        practiceActivity: "Using Reference Studio's Plumb Lines overlay, check the vertical alignment of the ear, shoulder, and ankle on a standing figure.",
        completionCriteria: "You can identify at least 3 landmark alignments using vertical and horizontal plumb lines.",
        recommendedOverlay: "plumb",
      },
      {
        id: "l3-06",
        level: 3,
        lessonNumber: 6,
        title: "Introduction to Sight-Size Drawing",
        subtitle: "Drawing at Exact Visual 1:1 Scale",
        category: "observation",
        estimatedMinutes: 18,
        objective: "Understand the classical Sight-Size method where the drawing and subject appear identical in size from the viewing position.",
        explanation: "Pioneered in 19th-century European academies, Sight-Size places the drawing canvas directly adjacent to the reference subject. The artist stands back at a fixed distance so that both the subject and drawing occupy the exact same visual field of view. Horizontal lines projected straight across confirm proportions with zero math.",
        visualDemonstration: "Easel standing beside a live model with horizontal benchmark lines projected directly across at eye height.",
        steps: [
          {
            stepNumber: 1,
            title: "Align Canvas Adjacent to Reference",
            instruction: "Place your drawing canvas directly side-by-side with your reference image at equal height.",
          },
          {
            stepNumber: 2,
            title: "Project Horizontal Benchmark Lines",
            instruction: "Draw straight horizontal level lines extending across from the top of the head, the eyes, the chin, and the baseline.",
          },
          {
            stepNumber: 3,
            title: "Step Back to Compare",
            instruction: "Step back 2 meters. Any discrepancy in height, angle, or mass becomes immediately apparent.",
          },
        ],
        practiceActivity: "Set up a split-screen or side-by-side view in Reference Studio and match the top and bottom benchmarks of a reference subject.",
        completionCriteria: "Your drawing matches the exact height and width of the reference subject using horizontal benchmark guidelines.",
        recommendedOverlay: "bargue",
      },
      {
        id: "l3-07",
        level: 3,
        lessonNumber: 7,
        title: "The Charles Bargue Block-In Method",
        subtitle: "Straight-Line Polygonal Envelopes Before Curves",
        category: "observation",
        estimatedMinutes: 20,
        objective: "Enclose complex curves inside straight-line polygonal envelopes as taught by the French Academic course.",
        explanation: "Charles Bargue's famous drawing course (1860s) strictly forbids beginners from drawing curved outlines. Curves are deceptive and cause artists to lose proportions. The Bargue method simplifies every curved silhouette into a series of straight chords and angles, creating an 'envelope' that locks in the form's proportions first.",
        visualDemonstration: "A complex anatomical arm contour reduced to an 8-sided straight-line polygonal envelope with vertex nodes.",
        steps: [
          {
            stepNumber: 1,
            title: "Find the Extreme Salient Points",
            instruction: "Identify the 6 to 8 most extreme outer points of your subject (highest, lowest, furthest left, furthest right).",
            diagramType: "shapes",
          },
          {
            stepNumber: 2,
            title: "Connect Vertices with Straight Lines Only",
            instruction: "Connect the points using straight lines only. Do not curve a single stroke. This creates your bounding envelope.",
            tip: "Straight lines are easy to judge for tilt angle and length; curves are not.",
          },
          {
            stepNumber: 3,
            title: "Subdivide Straight Chords Progressively",
            instruction: "Break each long straight line into two smaller straight chords at intermediate angles. Only round out the final contours after all angles are verified.",
          },
        ],
        practiceActivity: "Using Reference Studio's Bargue Block-In overlay, block in the outer silhouette of a complex classical sculpture reference using only straight lines.",
        completionCriteria: "The envelope accurately captures the subject's proportions using straight segments before any curved detailing.",
        recommendedOverlay: "bargue",
      },
    ],
  },

  // =========================================================================
  // LEVEL 4: GRID AND REFERENCE DRAWING
  // =========================================================================
  {
    level: 4,
    title: "Level 4 – Grid and Reference Drawing",
    subtitle: "Importing References, Grid Alignment & Optical Transfer",
    description: "Learn how professional artists use reference images, proportional grids, optical tracing, and comparative verification without losing artistic spontaneity.",
    icon: "⌗",
    lessons: [
      {
        id: "l4-01",
        level: 4,
        lessonNumber: 1,
        title: "Importing and Preparing a Reference Image",
        subtitle: "Cropping, Rotating & Lighting Analysis",
        category: "grid",
        estimatedMinutes: 12,
        objective: "Import, crop, orient, and prepare high-contrast reference images inside Reference Studio.",
        explanation: "A great drawing starts with a great reference. Understanding how to crop distracting backgrounds, level the horizon line, and analyze the lighting angle makes the drawing process significantly easier. In Reference Studio, all adjustments are 100% non-destructive.",
        visualDemonstration: "Reference Studio canvas showing photo import, 90-degree rotation, rule-of-thirds cropping, and brightness adjustment.",
        steps: [
          {
            stepNumber: 1,
            title: "Import Reference Photo",
            instruction: "Open Reference Studio and select a photo from your gallery or sample library.",
          },
          {
            stepNumber: 2,
            title: "Crop to the Salient Subject",
            instruction: "Open the Crop & Rotate modal. Drag the crop handles to eliminate distracting clutter and place the focal point on the thirds.",
          },
          {
            stepNumber: 3,
            title: "Adjust Brightness & Contrast",
            instruction: "Boost contrast slightly to clarify the shadow terminator boundary so contour lines become crisp.",
          },
        ],
        practiceActivity: "Import a photo of your choice into Reference Studio, crop it to an A4 aspect ratio, and level its horizon.",
        completionCriteria: "Your reference is cropped, properly oriented, and displayed clearly in the workspace.",
      },
      {
        id: "l4-02",
        level: 4,
        lessonNumber: 2,
        title: "Understanding Grid Drawing",
        subtitle: "Coordinate Systems, Aspect Ratio & Scaling",
        category: "grid",
        estimatedMinutes: 15,
        objective: "Understand how Renaissance masters (such as Dürer and Da Vinci) used grid screens to transfer complex images with zero distortion.",
        explanation: "Grid drawing breaks down an overwhelming subject into manageable square cells (A1, B2, C3...). Instead of trying to draw an entire face or landscape all at once, you only have to look at where lines enter and exit a single square. It teaches your brain to observe abstract shapes rather than symbolic representations.",
        visualDemonstration: "A 4x4 alphanumeric grid overlaid on a reference photo with coordinate labels (A1 to D4).",
        steps: [
          {
            stepNumber: 1,
            title: "The Renaissance Grid Screen",
            instruction: "Albrecht Dürer famously used a wooden frame laced with grid strings placed between his eye and the model. Our digital grid works the exact same way.",
            diagramType: "grid",
          },
          {
            stepNumber: 2,
            title: "Alphanumeric Cell Coordinates",
            instruction: "Columns are labeled with letters (A, B, C...) and rows with numbers (1, 2, 3...). Identify key features by their cell address (e.g. 'The eye sits in cell B2').",
          },
          {
            stepNumber: 3,
            title: "Scaling Between Reference and Paper",
            instruction: "If your reference has a 4x4 grid of 2 cm squares and your paper has a 4x4 grid of 5 cm squares, your drawing scales up 2.5x with mathematical accuracy.",
          },
        ],
        practiceActivity: "Add the Smart Grid overlay in Reference Studio and identify the exact cell coordinates of the subject's primary focal points.",
        completionCriteria: "You can identify coordinate intersections and explain how grids preserve scale.",
        recommendedOverlay: "grid",
      },
      {
        id: "l4-03",
        level: 4,
        lessonNumber: 3,
        title: "Adjusting Grid Modes & Millimetre Paper Scaling",
        subtitle: "Square, Aspect, Diagonals & Real-World Metric Mm",
        category: "grid",
        estimatedMinutes: 15,
        objective: "Switch between square grids, rule-of-thirds, golden ratio, and real-world physical millimetre spacing.",
        explanation: "ARTISTRY AI supports multiple grid modes. Beginners should start with 4 divisions. When preparing for real-world physical paper drawing, the 'Millimetre' mode maps the digital grid to exact physical metric measurements (e.g. 20 mm squares on A4 paper).",
        visualDemonstration: "Grid configuration toggling between standard square mode, diagonal guide mode, and 20mm paper grid mode.",
        steps: [
          {
            stepNumber: 1,
            title: "Square Grid Mode",
            instruction: "Set cell mode to 'square'. Each cell has equal width and height, preventing distortion regardless of canvas aspect ratio.",
            diagramType: "grid",
          },
          {
            stepNumber: 2,
            title: "Diagonal Cross Guides",
            instruction: "Enable 'Diagonals'. Diagonal lines bisect each cell, giving you 4 triangular sub-quadrants to pinpoint exact intersections.",
          },
          {
            stepNumber: 3,
            title: "Millimetre Paper Grid Scaling",
            instruction: "Set cell mode to 'millimetre' and enter '20mm'. The digital grid now matches a standard metric ruler placed on your physical A4 sketchpad.",
          },
        ],
        practiceActivity: "Configure a 6x6 square grid with diagonals and observe how the diagonal lines cross key facial landmarks.",
        completionCriteria: "You can configure divisions, toggle diagonals, and explain how millimetre mode coordinates with physical paper.",
        recommendedOverlay: "grid",
      },
      {
        id: "l4-04",
        level: 4,
        lessonNumber: 4,
        title: "Drawing Square by Square",
        subtitle: "Intersection Points, Cell Boundaries & Isolation",
        category: "grid",
        estimatedMinutes: 20,
        objective: "Draw a reference drawing one cell at a time by tracking where lines enter and exit cell borders.",
        explanation: "When drawing with a grid, don't look at the whole face or car. Focus strictly on cell B2. Ask: 'Where does the line cross the top border? Exactly in the middle? At 1/3? Where does it exit on the bottom border?' Mark those two entrance and exit dots and connect them.",
        visualDemonstration: "Close-up of a single grid cell showing entry tick at 50% on the top edge and exit tick at 33% on the right edge.",
        steps: [
          {
            stepNumber: 1,
            title: "Isolate a Single Cell",
            instruction: "Pick cell B2. Cover or ignore the surrounding image entirely.",
            diagramType: "grid",
          },
          {
            stepNumber: 2,
            title: "Mark the Border Entry and Exit Points",
            instruction: "Look at the four edges of the square. Mark the exact spot where the contour line crosses the border.",
            tip: "Divide each square's edge mentally into halves or thirds to place ticks precisely.",
          },
          {
            stepNumber: 3,
            title: "Connect the Points Across the Cell",
            instruction: "Draw the stroke connecting the entry dot to the exit dot within that square. Move to the adjacent square and repeat.",
          },
        ],
        practiceActivity: "Select a reference in Reference Studio and draw 4 adjacent grid cells focusing purely on border intersections.",
        completionCriteria: "The lines connect across adjacent grid cell borders seamlessly without jumps or mismatches.",
        recommendedOverlay: "grid",
      },
      {
        id: "l4-05",
        level: 4,
        lessonNumber: 5,
        title: "Tracing Basics & Lightbox Techniques",
        subtitle: "Using Tracing to Learn Contours (Without Crutches)",
        category: "grid",
        estimatedMinutes: 15,
        objective: "Use optical tracing as a learning tool to study contour rhythms, line weights, and form gestures.",
        explanation: "Tracing is often dismissed as 'cheating', but master animators, illustrators, and medical draftsmen use lightboxes to analyze anatomy, test inking variations, and study line flow. When used mindfully—focusing on WHY lines bend rather than blindly following pixels—tracing accelerates observation.",
        visualDemonstration: "Reference Studio Lightbox mode with corner registration marks for physical carbon paper transfer.",
        steps: [
          {
            stepNumber: 1,
            title: "Activate the Tracing Overlay",
            instruction: "Add the Lightbox & Tracing overlay in Reference Studio. Notice the corner transfer registration crosses.",
            diagramType: "lines",
          },
          {
            stepNumber: 2,
            title: "Adjust Reference Opacity & Whiteout",
            instruction: "Use the Whiteout slider in Image Adjustments to fade the photo slightly so your pencil lines stand out clearly.",
          },
          {
            stepNumber: 3,
            title: "Trace Salient Landmarks Deliberately",
            instruction: "Trace the primary outer silhouette and form contours with deliberate, continuous strokes. Don't trace every tiny wrinkle.",
          },
        ],
        practiceActivity: "Trace the major construction lines of a reference in Lightbox mode, then toggle the reference off to inspect your linework.",
        completionCriteria: "Your traced linework captures the essential gesture and structure of the reference cleanly.",
        recommendedOverlay: "tracing",
      },
      {
        id: "l4-06",
        level: 4,
        lessonNumber: 6,
        title: "Contour Observation & Line Quality",
        subtitle: "Blind Contour & Modified Contour Exercises",
        category: "grid",
        estimatedMinutes: 18,
        objective: "Perform blind contour and continuous line observation to synchronize hand movement with visual perception.",
        explanation: "Blind contour drawing (developed by Kimon Nicolaïdes in 'The Natural Way to Draw') involves looking 100% at the edge of the subject and 0% at your drawing paper. Your pencil moves in perfect synchronization with your eye as it crawls along the outer silhouette like an ant.",
        visualDemonstration: "An artist's eye tracing a complex hand silhouette while the pencil traces simultaneously without looking at the paper.",
        steps: [
          {
            stepNumber: 1,
            title: "Position Your Hand and Look Away",
            instruction: "Place your pencil on the canvas. Turn your head completely away from the drawing surface and look only at your subject.",
          },
          {
            stepNumber: 2,
            title: "The Ant Crawl Technique",
            instruction: "Imagine a tiny ant crawling along the exact outer edge of your subject. Move your pencil at the exact speed your eye tracks the ant.",
            tip: "Do not lift the pencil; keep it in continuous contact with the surface.",
          },
          {
            stepNumber: 3,
            title: "Inspect Without Judgment",
            instruction: "When finished, look at your drawing. It will look distorted, but you will notice incredible sensitivity to subtle curves and angles.",
          },
        ],
        practiceActivity: "Perform a 3-minute blind contour drawing of your non-dominant hand without glancing at the paper once.",
        completionCriteria: "You completed the exercise without looking down at the drawing surface during the stroke.",
      },
      {
        id: "l4-07",
        level: 4,
        lessonNumber: 7,
        title: "Comparing the Drawing with the Reference",
        subtitle: "Overlay Verification, Heatmaps & Error Detection",
        category: "grid",
        estimatedMinutes: 15,
        objective: "Compare your drawing against the reference using 50/50 split-screens and line accuracy verification.",
        explanation: "The final step of observation is self-critique. By overlaying your sketch directly on top of the reference photo, you can instantly spot whether an eye is 5 mm too low, a nose is too wide, or a shoulder is slanting too steeply.",
        visualDemonstration: "Split-screen slider showing drawing on the left and reference on the right with deviation highlights.",
        steps: [
          {
            stepNumber: 1,
            title: "Superimpose Drawing over Reference",
            instruction: "In Reference Studio, use the 50% opacity slider to overlay your sketch on the reference photo.",
          },
          {
            stepNumber: 2,
            title: "Look for Contour Drift",
            instruction: "Identify where your drawn contours diverge from the actual photographic lines.",
          },
          {
            stepNumber: 3,
            title: "Make Surgical Corrections",
            instruction: "Adjust the errant lines on your drawing layer while keeping the accurate sections intact.",
          },
        ],
        practiceActivity: "Compare your practice sketch with the reference photo using 50% opacity and identify 2 areas where your contours drifted.",
        completionCriteria: "You can articulate exactly where your drawing deviated and correct the contour alignment.",
      },
    ],
  },

  // =========================================================================
  // LEVEL 5: FACE DRAWING
  // =========================================================================
  {
    level: 5,
    title: "Level 5 – Face Drawing",
    subtitle: "The Andrew Loomis Method & Facial Thirds",
    description: "Master the gold standard of portrait drawing: Andrew Loomis's cranial sphere, brow equator, side plane disc, jaw wedge, and classical facial thirds.",
    icon: "👤",
    lessons: [
      {
        id: "l5-01",
        level: 5,
        lessonNumber: 1,
        title: "Understanding Classical Head Proportions",
        subtitle: "The 3 Equal Thirds of the Human Face",
        category: "loomis",
        estimatedMinutes: 15,
        objective: "Understand the universal classical division of the human face into three equal horizontal bands.",
        explanation: "Classical academic drawing breaks the human face into three equal vertical thirds: 1) From Hairline to Brow line; 2) From Brow line to the Base of the Nose; 3) From the Base of the Nose to the bottom of the Chin. Additionally, the eyes sit at the exact vertical midpoint of the entire head.",
        visualDemonstration: "A frontal portrait divided by 4 horizontal guidelines: Hairline, Brow, Nose Base, and Chin, showing three equal thirds.",
        steps: [
          {
            stepNumber: 1,
            title: "The Vertical Halfway Rule (Eye Line)",
            instruction: "The top of the skull to the bottom of the chin divides in half. The eyes sit directly on this central halfway line—NOT in the upper third.",
            tip: "Beginners consistently draw eyes too high because hair creates an optical illusion of extra height.",
            diagramType: "loomis",
          },
          {
            stepNumber: 2,
            title: "The Three Facial Thirds",
            instruction: "Measure: 1. Hairline to Brow = 1 Unit. 2. Brow to Nose Base = 1 Unit. 3. Nose Base to Chin = 1 Unit. These three spaces are identical.",
          },
          {
            stepNumber: 3,
            title: "Ear Alignment",
            instruction: "The top of the ear aligns with the brow line; the bottom of the ear aligns with the base of the nose.",
          },
        ],
        practiceActivity: "Draw an oval and divide it into the classical facial thirds. Place eye line, nose base, mouth line, and ears.",
        completionCriteria: "The three facial thirds are equal in height and the eyes sit at the vertical midpoint of the head.",
        recommendedOverlay: "loomis",
      },
      {
        id: "l5-02",
        level: 5,
        lessonNumber: 2,
        title: "Introduction to the Loomis Method",
        subtitle: "The Cranial Ball and Planar Wedge Concept",
        category: "loomis",
        estimatedMinutes: 18,
        objective: "Understand Andrew Loomis's ball-and-plane construction method for rotating the head in 3D space.",
        explanation: "Andrew Loomis (1892–1959) revolutionized portraiture with his construction method: start with a ball (the cranium), slice off the sides with flat vertical discs (the temples), drop a vertical jawline down to a chin box, and attach facial features to curved construction equators.",
        visualDemonstration: "The 3D Loomis wireframe head rotated at a 3/4 angle showing cranial sphere, sliced temporal disc, and jaw wedge.",
        steps: [
          {
            stepNumber: 1,
            title: "The Cranium Sphere",
            instruction: "The brain case is essentially a solid, spherical ball that never changes shape regardless of facial expressions.",
            diagramType: "loomis",
          },
          {
            stepNumber: 2,
            title: "The Flattened Temple Discs",
            instruction: "The human head is not a perfect sphere; it is flattened on the sides at the temples. Loomis slices off an ellipse from each side.",
          },
          {
            stepNumber: 3,
            title: "The Jawline Wedge",
            instruction: "From the center of the side disc and the brow, drop the jawline down to meet the chin box at the base of the lower third.",
          },
        ],
        practiceActivity: "Open the Loomis 3D Head overlay in Reference Studio and cycle through Stages 1 to 4 to observe the construction sequence.",
        completionCriteria: "You can articulate why the cranium sphere is sliced on the sides and how the jaw wedge connects to it.",
        recommendedOverlay: "loomis",
      },
      {
        id: "l5-03",
        level: 5,
        lessonNumber: 3,
        title: "Loomis Stage 1 & 2: Cranium Sphere & Brow Axis",
        subtitle: "Establishing Head Scale, Tilt & Centerline",
        category: "loomis",
        estimatedMinutes: 18,
        objective: "Draw the cranial sphere, brow equator, and curved centerline to establish head yaw and pitch.",
        explanation: "Stage 1 establishes scale: draw the cranium sphere over the crown and back of the head. Stage 2 establishes rotation: the brow line acts as the equator (pitch), while the vertical centerline drops from crown through the bridge of the nose (yaw).",
        visualDemonstration: "Loomis Stage 1 sphere with Stage 2 brow equator dipping down to indicate a downward head tilt.",
        steps: [
          {
            stepNumber: 1,
            title: "Stage 1: Place the Cranium Sphere",
            instruction: "Draw a circle that fits the top and back of the subject's skull.",
            diagramType: "loomis",
          },
          {
            stepNumber: 2,
            title: "Stage 2: Draw the Brow Equator",
            instruction: "Draw a curved ellipse across the sphere. If the subject looks down, the brow line curves downward. If looking up, it curves upward.",
          },
          {
            stepNumber: 3,
            title: "Draw the Vertical Centerline",
            instruction: "Drop a curved centerline from the top of the skull down through the center of the brow line, curving toward the side the subject faces.",
          },
        ],
        practiceActivity: "Draw 3 Loomis cranium spheres with brow equators: one looking straight, one looking down 20°, and one looking up 20°.",
        completionCriteria: "The brow equator curves realistically around the sphere to convey head pitch.",
        recommendedOverlay: "loomis",
      },
      {
        id: "l5-04",
        level: 5,
        lessonNumber: 4,
        title: "Loomis Stage 3 & 4: Side Plane Disc & Jawline",
        subtitle: "The Temporal Slice & Dropping the Jaw Wedge",
        category: "loomis",
        estimatedMinutes: 20,
        objective: "Slice the side plane disc and construct the jawline from below the ear to the chin point.",
        explanation: "Stage 3 cuts a flat elliptical disc on the side of the head, measuring approximately 2/3 of the cranium height. The center of this disc marks the attachment point of the ear. Stage 4 drops the angle of the jaw down to the chin wedge at the bottom third.",
        visualDemonstration: "Loomis Stage 3 temporal ellipse with crosshairs, connecting via Stage 4 jawline down to the chin box.",
        steps: [
          {
            stepNumber: 1,
            title: "Stage 3: Slice the Side Plane",
            instruction: "Draw an ellipse on the side of the sphere. Its height is 2/3 of the sphere height. Draw a '+' crosshair through its center.",
            diagramType: "loomis",
          },
          {
            stepNumber: 2,
            title: "Mark the Ear Attachment",
            instruction: "The ear attaches inside the lower rear quadrant of the side plane crosshair.",
          },
          {
            stepNumber: 3,
            title: "Stage 4: Drop the Jaw Angle",
            instruction: "From the bottom of the ear, drop a line down to the angle of the jaw (gonion), then angle straight forward to the chin.",
          },
        ],
        practiceActivity: "Complete Stages 1–4 of a Loomis construction on a 3/4 view portrait reference in Reference Studio.",
        completionCriteria: "The side disc is correctly placed at the temple and the jawline connects below the ear to the chin.",
        recommendedOverlay: "loomis",
      },
      {
        id: "l5-05",
        level: 5,
        lessonNumber: 5,
        title: "Loomis Stage 5 & 6: Facial Features Placement",
        subtitle: "Eye Sockets, Nose Pyramid, Mouth Barrel & Ears",
        category: "loomis",
        estimatedMinutes: 22,
        objective: "Block in the anatomical keystones: eye socket cavities, nose wedge, mouth barrel, and ears.",
        explanation: "Before drawing individual eyelashes or lips, block in the 3D masses. The eye sockets are two sunglasses-shaped cavities. The nose is a 3D keystone pyramid. The mouth sits on a cylindrical barrel (muzzle) that curves around the teeth.",
        visualDemonstration: "Loomis Stage 6 feature block-in with trapezoidal eye sockets, 3D nose wedge, and cylindrical mouth barrel.",
        steps: [
          {
            stepNumber: 1,
            title: "Block in the Eye Socket Cavities",
            instruction: "Carve two rectangular/oval cavities into the skull on either side of the keystone between the brows.",
            diagramType: "loomis",
          },
          {
            stepNumber: 2,
            title: "Construct the 3D Nose Pyramid",
            instruction: "Draw a narrow keystone wedge dropping from the glabella down to the nose base line, with visible bottom and side planes.",
          },
          {
            stepNumber: 3,
            title: "Construct the Mouth Barrel",
            instruction: "The mouth is not flat; it wraps around a curved cylinder. Draw the curved mouth line wrapping around this muzzle form.",
          },
        ],
        practiceActivity: "Block in the eye sockets, nose pyramid, and mouth barrel on your Loomis head construction.",
        completionCriteria: "Features are blocked in as 3D geometric volumes that align with the curved facial guidelines.",
        recommendedOverlay: "loomis",
      },
      {
        id: "l5-06",
        level: 5,
        lessonNumber: 6,
        title: "Loomis Stage 7 & 8: Facial Planes & Shadow Mapping",
        subtitle: "Zygomatic Facets, Forehead Planes & Tonal Boundaries",
        category: "loomis",
        estimatedMinutes: 25,
        objective: "Carve structural architectural planes and establish the primary light-shadow terminator boundary.",
        explanation: "Stage 7 carves the structural facets of the face: cheekbone (zygomatic) arches, forehead facets, and the chin box. Stage 8 groups the side and underneath planes into shadow to give the head immediate 3D volume.",
        visualDemonstration: "Loomis Stage 7 planar facets progressing to Stage 8 where all shadow planes are shaded in unified grey.",
        steps: [
          {
            stepNumber: 1,
            title: "Carve the Zygomatic Cheekbone Planes",
            instruction: "Draw the diagonal facet running from the top of the ear across the cheekbone down toward the corner of the mouth.",
            diagramType: "loomis",
          },
          {
            stepNumber: 2,
            title: "Carve the Forehead and Chin Planes",
            instruction: "Separate the flat front plane of the forehead from the receding temporal side planes. Box in the flat front plane of the chin.",
          },
          {
            stepNumber: 3,
            title: "Stage 8: Group the Shadow Planes",
            instruction: "Identify all planes facing away from the light (underside of nose, eye sockets, under lower lip, side of face). Fill them with a uniform shadow tone.",
          },
        ],
        practiceActivity: "Complete all 8 stages of a Loomis head study from a reference photo in Reference Studio.",
        completionCriteria: "Your drawing displays clear planar structure with unified shadow planes separated by a distinct terminator.",
        recommendedOverlay: "loomis",
      },
    ],
  },

  // =========================================================================
  // LEVEL 6: SHADING FUNDAMENTALS
  // =========================================================================
  {
    level: 6,
    title: "Level 6 – Shading Fundamentals",
    subtitle: "Light Direction, 5-Value Scale & Pencil Pressure",
    description: "Master classical form shading: Highlight, Midtone/Halftone, Core Shadow, Reflected Light, and Cast Shadow, plus pencil grades and pressure control.",
    icon: "◑",
    lessons: [
      {
        id: "l6-01",
        level: 6,
        lessonNumber: 1,
        title: "Understanding Light Direction & The 3D Light Dial",
        subtitle: "Azimuth (Angle) and Elevation (Height)",
        category: "shading",
        estimatedMinutes: 15,
        objective: "Determine the exact 3D direction of light in any scene using azimuth angle and elevation.",
        explanation: "Lighting in drawing is defined by two vectors: AZIMUTH (the horizontal compass angle from 0° to 360°) and ELEVATION (the height above the horizon from 15° to 75°). In Reference Studio, the 3D Directional Light Dial visualizes this light vector directly over your reference image.",
        visualDemonstration: "The 3D Light Dial compass showing a 45-degree azimuth arrow and a 45-degree elevation angle with projected light rays.",
        steps: [
          {
            stepNumber: 1,
            title: "Observe Shadows to Find Azimuth",
            instruction: "Look at the cast shadow on the ground. The shadow points in the EXACT OPPOSITE direction of the light source.",
            diagramType: "shading",
          },
          {
            stepNumber: 2,
            title: "Observe Shadow Length to Find Elevation",
            instruction: "If cast shadows are short, the light is high (high elevation, noon sun). If cast shadows are long, the light is low (low elevation, sunset).",
          },
          {
            stepNumber: 3,
            title: "Use the Shading Overlay Light Dial",
            instruction: "In Reference Studio, open the 5-Value Shading overlay and adjust the Light Angle to match your photo's key light.",
          },
        ],
        practiceActivity: "Inspect 3 different portrait photos and set the Shading overlay's Light Angle to match each photo's lighting vector.",
        completionCriteria: "You can accurately deduce the azimuth angle and elevation of the light source in a reference photo.",
        recommendedOverlay: "shading",
      },
      {
        id: "l6-02",
        level: 6,
        lessonNumber: 2,
        title: "The 5 Canonical Tonal Value Zones",
        subtitle: "Highlight, Halftone, Core Shadow, Reflected Light & Cast Shadow",
        category: "shading",
        estimatedMinutes: 20,
        objective: "Understand and render the five distinct tonal zones that describe solid 3D form.",
        explanation: "The human eye simplifies curved form shading into 5 canonical values: 1) HIGHLIGHT (purest light point facing the sun); 2) MIDTONE / HALFTONE (surfaces angling away from light); 3) CORE SHADOW (darkest band where light terminates); 4) REFLECTED LIGHT (ambient bounce inside the shadow); 5) CAST SHADOW (occlusion where form blocks light).",
        visualDemonstration: "A classical plaster sphere displaying all 5 tonal value zones with numerical labels (Level 1 to Level 5).",
        steps: [
          {
            stepNumber: 1,
            title: "Level 1: Highlight",
            instruction: "The brightest point on the object where the light source reflects directly into the viewer's eye. Leave this pure paper white.",
            diagramType: "shading",
          },
          {
            stepNumber: 2,
            title: "Level 2: Midtone / Halftone",
            instruction: "The true color and local value of the object, illuminated by light grazing the surface.",
          },
          {
            stepNumber: 3,
            title: "Level 3: Core Shadow",
            instruction: "The dark band running along the terminator line. This is the darkest part of the object itself.",
          },
          {
            stepNumber: 4,
            title: "Level 4: Reflected Light",
            instruction: "Light bouncing off the tabletop or floor back into the shadow side. CRITICAL RULE: Reflected light is ALWAYS darker than the darkest halftone.",
            tip: "Beginners make reflected light too bright; it must remain firmly in the shadow family.",
          },
          {
            stepNumber: 5,
            title: "Level 5: Cast Shadow & Occlusion",
            instruction: "The shadow cast onto the ground. The sharp, darkest point where the object touches the ground is called the occlusion crevice.",
          },
        ],
        practiceActivity: "Shade a complete 5-value sphere, labeling each of the 5 distinct tonal zones.",
        completionCriteria: "Your drawing exhibits all 5 distinct value zones with reflected light kept strictly darker than the halftone.",
        recommendedOverlay: "shading",
      },
      {
        id: "l6-03",
        level: 6,
        lessonNumber: 3,
        title: "The Core Shadow Terminator Curve",
        subtitle: "The Sacred Boundary Between Light and Shadow",
        category: "shading",
        estimatedMinutes: 18,
        objective: "Identify and draw the crisp terminator curve that separates the light side from the shadow side on curved forms.",
        explanation: "The single most important line in shading is the TERMINATOR. It is the boundary where light rays can no longer physically graze the curvature of the object. Master artists treat the terminator with utmost care: on hard angles (cubes) it is razor sharp; on curved forms (spheres, cheeks) it is a firm, curved crest.",
        visualDemonstration: "A portrait showing the terminator line snaking across forehead, temple, cheekbone, and jawline.",
        steps: [
          {
            stepNumber: 1,
            title: "Trace the Terminator First",
            instruction: "Before adding any shading, draw a light line representing the terminator across the entire subject.",
            diagramType: "shading",
          },
          {
            stepNumber: 2,
            title: "Fill the Shadow Side with Unified Flat Tone",
            instruction: "Fill everything on the shadow side of the terminator with a uniform 50% grey tone. Don't add reflected light yet.",
          },
          {
            stepNumber: 3,
            title: "Darken the Core Shadow Along the Crest",
            instruction: "Add a firm, darker band right along the terminator line where the form transitions away from the light.",
          },
        ],
        practiceActivity: "Using Reference Studio's Shading overlay, observe the Terminator curve on a portrait and draw it on your sketch.",
        completionCriteria: "Your drawing has a distinct terminator curve separating the light and shadow halves cleanly.",
        recommendedOverlay: "shading",
      },
      {
        id: "l6-04",
        level: 6,
        lessonNumber: 4,
        title: "Recommended Graphite Pencil Grades (2H to 6B)",
        subtitle: "Choosing the Right Pencil for Each Value Zone",
        category: "shading",
        estimatedMinutes: 15,
        objective: "Select and combine 2H, HB, 2B, 4B, and 6B pencil grades for clean, non-smudged tonal values.",
        explanation: "Attempting to shade an entire drawing with a single HB pencil leads to frustration: pressing hard causes shiny, indented paper. In Reference Studio, the Shading overlay displays recommended pencil grades for each value zone: 2H for highlights, HB for midtones, 2B for core shadows, and 4B–6B for deep cast shadows.",
        visualDemonstration: "The graphite grade indicator bar showing 2H for Zone 1, HB for Zone 2, 2B for Zone 3, B for Zone 4, and 4B–6B for Zone 5.",
        steps: [
          {
            stepNumber: 1,
            title: "Zone 1 & 2: 2H and H Pencils",
            instruction: "Use a sharp 2H or H pencil with light, feathered strokes for delicate midtones and halftones near the highlight.",
          },
          {
            stepNumber: 2,
            title: "Zone 3: 2B Pencil",
            instruction: "Switch to a 2B pencil for the core shadow and terminator. The softer graphite lays down velvety tones without heavy pressure.",
          },
          {
            stepNumber: 3,
            title: "Zone 5: 4B to 6B Pencils",
            instruction: "Reserve 4B and 6B pencils exclusively for deep cast shadows, nostrils, pupils, and occlusion crevices.",
            tip: "Never use a 6B pencil in the light areas; it will create muddy, grainy halftones.",
          },
        ],
        practiceActivity: "Create a 5-step tonal value swatch using 2H for step 1, HB for step 2, 2B for step 3, 4B for step 4, and 6B for step 5.",
        completionCriteria: "Each step is distinctly darker than the previous without paper denting or sheen.",
        recommendedOverlay: "shading",
      },
      {
        id: "l6-05",
        level: 6,
        lessonNumber: 5,
        title: "Cross-Hatching Following Form Curvature",
        subtitle: "Contour Hatching That Enhances 3D Volume",
        category: "shading",
        estimatedMinutes: 20,
        objective: "Execute cross-hatching strokes that curve around the 3D surface instead of flattening it with straight lines.",
        explanation: "Straight hatching lines across a round ball flatten it into a flat cardboard disc. CONTOUR HATCHING curves the strokes along the object's cross-contour latitudes (like the rings of an apple). The curvature of your pencil strokes reinforces the 3D volume.",
        visualDemonstration: "A cylinder shaded with straight horizontal lines (flattening effect) versus curved cross-contour hatching (enhancing 3D volume).",
        steps: [
          {
            stepNumber: 1,
            title: "Find the Surface Curvature",
            instruction: "Before stroking, visualize wrapping a piece of string around the form. Your hatching lines should follow that string.",
            diagramType: "cylinder",
          },
          {
            stepNumber: 2,
            title: "Apply Primary Contour Strokes",
            instruction: "Hatch along the curve of the form with smooth, curved arcs. Keep line spacing consistent.",
          },
          {
            stepNumber: 3,
            title: "Apply Secondary Cross-Hatching",
            instruction: "Layer a second set of curved strokes at a 30-degree angle to deepen the tone where shadow intensifies.",
          },
        ],
        practiceActivity: "Shade an arm or cylinder using contour cross-hatching that curves around the form.",
        completionCriteria: "All hatching strokes curve consistently with the 3D cylindrical surface.",
      },
    ],
  },

  // =========================================================================
  // LEVEL 7: COMPLETE DRAWING PRACTICE
  // =========================================================================
  {
    level: 7,
    title: "Level 7 – Complete Drawing Practice",
    subtitle: "Guided Still Life, Portraits & Final Master Studies",
    description: "Synthesize all 6 levels into complete traditional artworks: guided still life, classical portrait study, and independent master practice.",
    icon: "🏆",
    lessons: [
      {
        id: "l7-01",
        level: 7,
        lessonNumber: 1,
        title: "Guided Still Life Drawing: The Coffee Cup & Apple",
        subtitle: "Combining Block-In, Proportions, Forms & 5-Value Shading",
        category: "practice",
        estimatedMinutes: 30,
        objective: "Execute a complete still life drawing integrating block-in envelopes, cylindrical construction, and 5-value shading.",
        explanation: "Still life is the traditional training ground for all drawing masters. In this guided exercise, you combine a cylinder (coffee cup) with a sphere (apple) under directional light, following the exact 5-step traditional studio workflow.",
        visualDemonstration: "Step-by-step progression: 1) Bargue block-in envelope; 2) Geometric cylinder & sphere; 3) Terminator boundary; 4) 5-value shading; 5) Highlights.",
        steps: [
          {
            stepNumber: 1,
            title: "Step 1: The Bargue Block-In Envelope",
            instruction: "Establish the bounding rectangle for both objects. Use straight lines to block in the silhouette.",
            diagramType: "shapes",
          },
          {
            stepNumber: 2,
            title: "Step 2: Construct Cylinder and Sphere",
            instruction: "Draw the cylinder's spine and top/bottom ellipses. Construct the apple's sphere and curved equator.",
          },
          {
            stepNumber: 3,
            title: "Step 3: Establish Plumb Lines and Proportions",
            instruction: "Drop a vertical plumb line from the cup's rim to verify where the apple touches the cup.",
          },
          {
            stepNumber: 4,
            title: "Step 4: Map the Terminator & Shadows",
            instruction: "Draw the terminator on both objects. Fill both shadow areas and cast shadows with unified flat tone.",
          },
          {
            stepNumber: 5,
            title: "Step 5: Render 5-Value Scale & Highlights",
            instruction: "Deepen core shadows with 2B, render halftones with HB, and lift highlights cleanly with a kneaded eraser.",
          },
        ],
        practiceActivity: "Complete a finished drawing of a coffee cup and apple on an A4 sheet in Reference Studio.",
        completionCriteria: "Drawing demonstrates accurate block-in, correct cylinder ellipses, and unified 5-value tonal shading.",
      },
      {
        id: "l7-02",
        level: 7,
        lessonNumber: 2,
        title: "Guided Classical Portrait Study: 3/4 Head",
        subtitle: "Full Loomis Construction to Finished Shaded Portrait",
        category: "practice",
        estimatedMinutes: 45,
        objective: "Execute a finished 3/4 classical portrait drawing from a reference using the complete 8-stage Loomis method.",
        explanation: "This capstone exercise puts everything together for portraiture: Loomis cranium ball, brow equator, side temporal disc, jaw wedge, facial thirds, socket keystones, and directional planar shading.",
        visualDemonstration: "A finished classical portrait progression from Loomis construction wireframe to rendered 5-value shaded portrait.",
        steps: [
          {
            stepNumber: 1,
            title: "Step 1: Loomis Cranium Sphere & Side Disc",
            instruction: "Draw the cranium sphere. Sice the 2/3 side temporal ellipse and place the brow equator.",
            diagramType: "loomis",
          },
          {
            stepNumber: 2,
            title: "Step 2: Jawline and Facial Thirds",
            instruction: "Drop the jawline from below the ear to the chin. Verify the 3 equal facial thirds (Hairline, Brow, Nose Base, Chin).",
          },
          {
            stepNumber: 3,
            title: "Step 3: Feature Block-In",
            instruction: "Carve eye socket cavities, construct the 3D nose pyramid wedge, and block in the mouth barrel and ears.",
          },
          {
            stepNumber: 4,
            title: "Step 4: Map the Shadow Terminator",
            instruction: "Locate the primary shadow terminator snaking down the temple, cheekbone, and jaw. Shade all shadow planes unified.",
          },
          {
            stepNumber: 5,
            title: "Step 5: Model Features & Graphite Tones",
            instruction: "Refine eyes, nose, and lips. Add core shadows with 2B/4B, keeping reflected light properly dark.",
          },
        ],
        practiceActivity: "Complete a full portrait study using the Loomis overlay in Reference Studio.",
        completionCriteria: "The portrait exhibits accurate Loomis 3D structure, correct facial thirds, and unified directional shading.",
        recommendedOverlay: "loomis",
      },
      {
        id: "l7-03",
        level: 7,
        lessonNumber: 3,
        title: "Independent Master Drawing Exercise",
        subtitle: "The Final Capstone Traditional Drawing",
        category: "practice",
        estimatedMinutes: 60,
        objective: "Execute an independent traditional drawing from start to finish without step-by-step hand-holding.",
        explanation: "You have graduated from complete beginner to knowledgeable traditional draftsman. You now understand materials, grips, line ghosting, 3D forms, proportions, sighting, Bargue envelopes, Loomis head construction, and 5-value form shading. Choose any reference photo and execute a complete traditional drawing.",
        visualDemonstration: "The artist's completed master portfolio piece displaying confidence, structural integrity, and tonal mastery.",
        steps: [
          {
            stepNumber: 1,
            title: "Phase 1: Observation & Setup",
            instruction: "Import your reference photo into Reference Studio. Crop to your desired paper aspect ratio and observe light direction.",
          },
          {
            stepNumber: 2,
            title: "Phase 2: Light Construction Block-In",
            instruction: "Use a 2H pencil or light digital brush to establish bounding envelopes, plumb lines, and geometric volumes.",
          },
          {
            stepNumber: 3,
            title: "Phase 3: Terminator & Shadow Separation",
            instruction: "Separate the entire subject into Light Side versus Shadow Side along the crisp terminator boundary.",
          },
          {
            stepNumber: 4,
            title: "Phase 4: Tonal Modeling & Details",
            instruction: "Build the 5 values progressively using proper pencil grades and cross-contour hatching.",
          },
          {
            stepNumber: 5,
            title: "Phase 5: Self-Critique & Final Highlights",
            instruction: "Step back 2 meters. Compare with your reference using 50% opacity, lift final highlights with an eraser, and sign your work.",
          },
        ],
        practiceActivity: "Execute your final master drawing and save it in My Projects.",
        completionCriteria: "Your drawing is fully completed and saved in the project library, demonstrating mastery of the 7-level curriculum.",
      },
    ],
  },
];

// =========================================================================
// PHASE 7A: PEDAGOGICAL CURRICULUM ENRICHMENT
// =========================================================================

function getCategoryMaterials(category: string, _title: string): string[] {
  switch (category) {
    case "fundamentals":
      return [
        "2H, HB, and 2B graphite drawing pencils",
        "A4 drawing paper (100–140 gsm)",
        "Kneaded eraser & vinyl plastic eraser",
        "Pencil sharpener with long-point lead",
      ];
    case "shapes":
      return [
        "2H pencil for wireframe construction",
        "HB and 2B pencils for definitive contours",
        "A4 or A3 smooth cartridge paper (120–160 gsm)",
        "Kneaded eraser for lifting construction guides",
      ];
    case "observation":
      return [
        "HB pencil & 30cm straightedge or sighting stick",
        "Proportional divider or thread for plumb sighting",
        "A4 medium-tooth sketchbook",
        "Kneaded eraser for highlight correction",
      ];
    case "grid":
      return [
        "2H hard pencil for faint grid lines",
        "HB and 2B pencils for subject drawing",
        "A4 or A3 paper (calibrated in Paper Studio)",
        "30 cm clear metric ruler (calibrated in mm)",
        "Kneaded eraser to lift grid lines after completion",
      ];
    case "loomis":
      return [
        "2H pencil for cranial sphere & jaw construction",
        "HB pencil for facial thirds & feature placement",
        "2B/4B pencils for deep accents (pupils, nostrils, hair)",
        "A4 drawing paper & kneaded eraser",
      ];
    case "shading":
      return [
        "2H, HB, 2B, 4B, and 6B graphite range",
        "Tortillon / blending stump (optional)",
        "Kneaded eraser shaped to a fine chisel tip",
        "Heavyweight drawing paper (150–200 gsm)",
        "Clean scrap sheet to rest hand on while shading",
      ];
    case "practice":
    default:
      return [
        "Full graphite pencil set (2H through 6B)",
        "A4 or A3 high-grade drawing paper",
        "Kneaded eraser & precision mono eraser",
        "Calibrated ruler & sighting stick",
        "Physical reference subject or printed plate",
      ];
  }
}

function getCategoryCommonMistakes(category: string, _title: string): CommonMistake[] {
  switch (category) {
    case "fundamentals":
      return [
        {
          mistake: "Drawing with hesitant short wrist strokes ('chicken scratching')",
          prevention: "Lock your wrist gently and swing your entire arm from the shoulder joint using the overhand grip.",
        },
        {
          mistake: "Pressing too hard with graphite during initial layout",
          prevention: "Hold the pencil higher up the barrel and use a 2H pencil so construction lines erase cleanly.",
        },
      ];
    case "shapes":
      return [
        {
          mistake: "Flattening cylindrical end-caps or skewing ellipse axes",
          prevention: "Ensure the ellipse minor axis always aligns with the cylinder's central longitudinal axle.",
        },
        {
          mistake: "Drawing diverging box edges instead of converging edges",
          prevention: "Ghost your lines toward the vanishing points before touching the pencil to the paper.",
        },
      ];
    case "observation":
      return [
        {
          mistake: "Drawing assumed symbols instead of actual observed angles",
          prevention: "Use sighting techniques: hold your pencil at arm's length with locked elbow to measure relative proportions.",
        },
        {
          mistake: "Tilting the measuring stick between sighting and drawing",
          prevention: "Keep your sighting stick strictly perpendicular to your line of sight at full arm extension.",
        },
      ];
    case "grid":
      return [
        {
          mistake: "Drawing grid lines too dark, leaving permanent grooves in paper",
          prevention: "Rule grid lines with a sharp 2H pencil using light feathery touch so they erase effortlessly.",
        },
        {
          mistake: "Miscounting rows or columns during feature transfer",
          prevention: "Label coordinates (A, B, C across top; 1, 2, 3 down side) and verify cell index before drawing.",
        },
      ];
    case "loomis":
      return [
        {
          mistake: "Flattening the side plane disc of the skull",
          prevention: "The side ellipse measures exactly 2/3 of the sphere height; rotate it to match head tilt.",
        },
        {
          mistake: "Drawing facial features before establishing the 3D skull cage",
          prevention: "Always complete the cranium sphere, brow line, and jaw block-in before detailing eyes, nose, or lips.",
        },
      ];
    case "shading":
      return [
        {
          mistake: "Blending light and shadow across the terminator line",
          prevention: "Group all shadows into a single flat value family first before introducing halftones in the light.",
        },
        {
          mistake: "Making reflected shadow light brighter than direct lit surfaces",
          prevention: "Reflected light is part of the shadow family; it must stay darker than the darkest lit halftone.",
        },
      ];
    case "practice":
    default:
      return [
        {
          mistake: "Rushing into fine details before verifying overall proportions",
          prevention: "Step back 2 meters from your physical drawing at each stage to evaluate big-picture shapes.",
        },
        {
          mistake: "Smudging delicate tonal work with the drawing palm",
          prevention: "Keep a clean sheet of glassine or scrap paper under your drawing hand at all times.",
        },
      ];
  }
}

function getCategoryChecklist(category: string, _criteria: string): string[] {
  const base = [
    "Are all construction lines light enough to be lifted cleanly with a kneaded eraser?",
    "Did you maintain relaxed arm posture and draw from the shoulder?",
  ];

  switch (category) {
    case "fundamentals":
      return [
        ...base,
        "Are your straight and curved lines confident single strokes without hesitation?",
        "Did you inspect the difference between H and B graphite grades on paper tooth?",
      ];
    case "shapes":
      return [
        ...base,
        "Do 3D forms show proper perspective convergence without reverse-tapering?",
        "Are ellipses symmetrical along both major and minor axes?",
      ];
    case "observation":
      return [
        ...base,
        "Have relative height-to-width ratios been checked with sight-size measurement?",
        "Do key vertical and horizontal landmarks align under gravity plumb checks?",
      ];
    case "grid":
      return [
        ...base,
        "Does each contour line intersect cell boundaries at the exact coordinate ratios?",
        "Are grid labels clearly marked on physical paper matching the digital reference?",
      ];
    case "loomis":
      return [
        ...base,
        "Are the three facial divisions (hairline, brow, nose base, chin) proportionally equal?",
        "Is the cranial ball-and-plane tilt consistent with the perspective eye level?",
      ];
    case "shading":
      return [
        ...base,
        "Is there an unequivocal separation between the light mass and shadow mass?",
        "Are the 5 form values (highlight, halftone, core shadow, reflected light, cast shadow) distinct?",
      ];
    case "practice":
    default:
      return [
        ...base,
        "Did you step back 2 meters to review proportions and tonal balance from a distance?",
        "Does the completed physical drawing satisfy the lesson's core completion criteria?",
      ];
  }
}

function getPhysicalPaperGuidance(category: string): string {
  switch (category) {
    case "fundamentals":
      return "Mount your drawing paper at a 15–25° slant. Keep your wrist straight and draw large, confident lines across the entire page.";
    case "shapes":
      return "Draw forms at least 8–10 cm in size on your paper. Sizing forms generously prevents cramped wrist drawing and sharpens geometric accuracy.";
    case "observation":
      return "Sit upright with your drawing board aligned vertically. Lock your elbow straight when sighting measuring coordinates against your subject.";
    case "grid":
      return "Use ARTISTRY AI Paper & Print Studio to print a calibrated grid or rule intervals with a metal ruler. Keep 2H pencil pressure ultra-light.";
    case "loomis":
      return "Begin with a faint circle about the size of a tennis ball. Rotate your entire paper sheet if needed to strike smooth circular arcs.";
    case "shading":
      return "Place a clean scrap sheet of paper under your drawing hand to prevent skin oils from smudging graphite into the paper tooth.";
    case "practice":
    default:
      return "Step back 2 meters from your physical easel or table every 10 minutes. A distant vantage point immediately reveals structural flaws.";
  }
}

function enrichLesson(lesson: CurriculumLesson): CurriculumLesson {
  return {
    ...lesson,
    requiredMaterials: lesson.requiredMaterials ?? getCategoryMaterials(lesson.category, lesson.title),
    commonMistakes: lesson.commonMistakes ?? getCategoryCommonMistakes(lesson.category, lesson.title),
    selfAssessmentChecklist:
      lesson.selfAssessmentChecklist ?? getCategoryChecklist(lesson.category, lesson.completionCriteria),
    physicalPaperGuidance: lesson.physicalPaperGuidance ?? getPhysicalPaperGuidance(lesson.category),
  };
}

export const DRAWING_CURRICULUM: CurriculumLevel[] = BASE_CURRICULUM.map((level) => ({
  ...level,
  lessons: level.lessons.map(enrichLesson),
}));

/**
 * Helper to look up a lesson by its unique id.
 */
export function getLessonById(id: string): CurriculumLesson | undefined {
  for (const level of DRAWING_CURRICULUM) {
    const found = level.lessons.find((l) => l.id === id);
    if (found) return found;
  }
  return undefined;
}

/**
 * Returns all lessons as a flat list.
 */
export function getAllLessons(): CurriculumLesson[] {
  return DRAWING_CURRICULUM.flatMap((lvl) => lvl.lessons);
}

/**
 * Returns the next logical lesson given a current lesson id.
 */
export function getNextLesson(currentLessonId: string): CurriculumLesson | undefined {
  const all = getAllLessons();
  const idx = all.findIndex((l) => l.id === currentLessonId);
  if (idx >= 0 && idx < all.length - 1) {
    return all[idx + 1];
  }
  return undefined;
}

/**
 * Returns the previous logical lesson given a current lesson id.
 */
export function getPreviousLesson(currentLessonId: string): CurriculumLesson | undefined {
  const all = getAllLessons();
  const idx = all.findIndex((l) => l.id === currentLessonId);
  if (idx > 0) {
    return all[idx - 1];
  }
  return undefined;
}
