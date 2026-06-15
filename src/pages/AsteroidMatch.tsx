import React, { useState, useEffect, useRef, useCallback } from "react";
import { useParams, useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";
import { lessonService, type VocabItem, type Lesson } from "../service/lessonService";
import { historyService } from "../service/historyService";
import { soundSynth } from "../utils/soundSynth";
import { toast } from "react-hot-toast";
import {
  Volume2,
  Heart,
  RotateCcw,
  ArrowLeft,
  AlertCircle,
  Sparkles,
  Gamepad2,
  CheckCircle2,
  XCircle
} from "lucide-react";

import airplaneImg from "../assets/airplanemode/airplane.png";
import laserGif from "../assets/airplanemode/laser.gif";
import asteroidImg from "../assets/airplanemode/thienthach.png";

// Game states
type GameState = "LOBBY" | "PLAYING" | "RESULT";
type StudyType = "word-to-meaning" | "meaning-to-word" | "listening";
type Difficulty = "easy" | "medium" | "hard";

// Helper to calculate asteroid size based on text length to prevent overflow
const getAsteroidSize = (text: string): number => {
  const len = text.length;
  if (len <= 15) return 70;
  if (len <= 35) return 85;
  if (len <= 65) return 100;
  return 120;
};

interface Asteroid {
  id: string;
  vocab: VocabItem;
  text: string;
  size: number;
  x: number;
  y: number;
  vx: number;
  vy: number;
  speed: number;
  column: number;
  isCorrect: boolean;
  isDestroyed: boolean;
}

interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  radius: number;
  color: string;
  alpha: number;
}

interface LaserState {
  active: boolean;
  fromX: number;
  fromY: number;
  toX: number;
  toY: number;
}

const AsteroidMatch: React.FC = () => {
  const { lessonId } = useParams<{ lessonId: string }>();
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuth();

  const fromPath = location.state?.from || (lessonId ? `/lesson/${lessonId}` : "/");

  // Lesson states
  const [lesson, setLesson] = useState<Lesson | null>(null);
  const [vocabList, setVocabList] = useState<VocabItem[]>([]);
  const [loading, setLoading] = useState(true);


  // Game Lobby Configurations
  const [studyType, setStudyType] = useState<StudyType>("word-to-meaning");
  const [difficulty, setDifficulty] = useState<Difficulty>("medium");

  // Game Play States
  const [gameState, setGameState] = useState<GameState>("LOBBY");
  const [questionsQueue, setQuestionsQueue] = useState<VocabItem[]>([]);
  const [currentQuestionIdx, setCurrentQuestionIdx] = useState(0);
  const [asteroids, setAsteroids] = useState<Asteroid[]>([]);
  const [score, setScore] = useState(0);
  const [hp, setHp] = useState(3);
  const [combo, setCombo] = useState(0);
  const [maxCombo, setMaxCombo] = useState(0);
  const [isWaitingNext, setIsWaitingNext] = useState(false);

  // Visual states
  const [rotation, setRotation] = useState(0);
  const [laser, setLaser] = useState<LaserState>({ active: false, fromX: 0, fromY: 0, toX: 0, toY: 0 });
  const [shake, setShake] = useState(false);
  const [showLaserGif, setShowLaserGif] = useState(false);
  const [laserGifPos, setLaserGifPos] = useState({ x: 0, y: 0 });

  // History and tracking states
  const [startTime, setStartTime] = useState<number>(0);
  const [incorrectList, setIncorrectList] = useState<VocabItem[]>([]);

  // Refs for animation loop
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const particlesRef = useRef<Particle[]>([]);
  const starsRef = useRef<{ x: number; y: number; speed: number; radius: number }[]>([]);
  const gameLoopRef = useRef<number | null>(null);

  // Game dimensions (based on relative layout)
  const containerWidth = 800;
  const containerHeight = 600;

  // Initialize data
  useEffect(() => {
    const fetchLesson = async () => {
      if (!lessonId) return;
      try {
        setLoading(true);
        const data = await lessonService.getLesson(lessonId);
        setLesson(data);
        setVocabList(data.vocabulary || []);

      } catch (err) {
        console.error(err);
        toast.error("Lỗi khi tải dữ liệu bài học");
      } finally {
        setLoading(false);
      }
    };
    fetchLesson();
  }, [lessonId, user?.username]);

  // Init Stars Background
  useEffect(() => {
    const stars = [];
    for (let i = 0; i < 70; i++) {
      stars.push({
        x: Math.random() * containerWidth,
        y: Math.random() * containerHeight,
        speed: 0.5 + Math.random() * 1.5,
        radius: 0.5 + Math.random() * 1.2
      });
    }
    starsRef.current = stars;
  }, []);

  // Starfield & Particle Canvas Animation Loop
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    // Set canvas dimensions
    canvas.width = containerWidth;
    canvas.height = containerHeight;

    let animFrameId: number;

    const render = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      // 1. Draw Starfield
      ctx.fillStyle = "#ffffff";
      starsRef.current.forEach(star => {
        ctx.beginPath();
        ctx.arc(star.x, star.y, star.radius, 0, Math.PI * 2);
        // Brightness proportional to speed
        ctx.fillStyle = `rgba(226, 232, 240, ${star.speed / 2})`;
        ctx.fill();

        // Update star Y position (scroll down)
        star.y += star.speed * (gameState === "PLAYING" ? 1.5 : 0.5);
        if (star.y > containerHeight) {
          star.y = 0;
          star.x = Math.random() * containerWidth;
        }
      });

      // 2. Draw & Update Particles
      particlesRef.current = particlesRef.current.filter(p => {
        p.x += p.vx;
        p.y += p.vy;
        p.alpha -= 0.02;
        p.radius = Math.max(0.1, p.radius - 0.05);

        ctx.beginPath();
        ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);

        // Convert rgb/hex to rgba for transparency
        let color = p.color;
        if (color.startsWith("rgb")) {
          color = color.replace("rgb", "rgba").replace(")", `, ${p.alpha})`);
        } else {
          color = `rgba(249, 115, 22, ${p.alpha})`; // fallback orange glow
        }

        ctx.fillStyle = color;
        ctx.fill();

        return p.alpha > 0 && p.radius > 0.1;
      });

      animFrameId = requestAnimationFrame(render);
    };

    animFrameId = requestAnimationFrame(render);
    return () => cancelAnimationFrame(animFrameId);
  }, [gameState]);

  // Handle auto voice output in Listening Mode
  const playSpeech = useCallback((text: string) => {
    if ("speechSynthesis" in window) {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = "en-US";
      utterance.rate = 0.85; // slightly slower for educational purposes
      window.speechSynthesis.speak(utterance);
    }
  }, []);

  // Generate particle explosion helper
  const createExplosion = (x: number, y: number, color: string) => {
    const particleCount = 25;
    const newParticles: Particle[] = [];
    for (let i = 0; i < particleCount; i++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = 1 + Math.random() * 5;
      newParticles.push({
        x,
        y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        radius: 2 + Math.random() * 3,
        color,
        alpha: 1
      });
    }
    particlesRef.current = [...particlesRef.current, ...newParticles];
  };

  // Get random distractor definitions/words
  const getDistractors = (correctItem: VocabItem, all: VocabItem[], count: number = 3): VocabItem[] => {
    const pool = all.filter(item => item.word !== correctItem.word);

    // Shuffle pool
    const shuffled = [...pool].sort(() => Math.random() - 0.5);
    const selected = shuffled.slice(0, count);

    // If pool is too small, pad with dummy vocabulary
    while (selected.length < count) {
      selected.push({
        word: `Distractor ${selected.length + 1}`,
        definition: `Đáp án nhiễu ${selected.length + 1}`
      });
    }

    return selected;
  };

  // Get random distractor definitions/words excluding specific words
  const getDistractorsExcluded = (
    correctItem: VocabItem,
    all: VocabItem[],
    excludeWords: string[],
    count: number
  ): VocabItem[] => {
    const pool = all.filter(
      item => item.word !== correctItem.word && !excludeWords.includes(item.word)
    );

    // Shuffle pool
    const shuffled = [...pool].sort(() => Math.random() - 0.5);
    const selected = shuffled.slice(0, count);

    // If pool is too small, pad with dummy vocabulary
    while (selected.length < count) {
      selected.push({
        word: `Distractor ${selected.length + 1}`,
        definition: `Đáp án nhiễu ${selected.length + 1}`
      });
    }

    return selected;
  };





  // Spawn asteroids for the current question
  const spawnQuestionAsteroids = useCallback((questionIdx: number, queue: VocabItem[]) => {
    if (questionIdx >= queue.length) return;
    const currentQuestion = queue[questionIdx];

    // Play voice automatically in Listening Mode
    if (studyType === "listening") {
      playSpeech(currentQuestion.word);
    }

    // Determine correct and incorrect options
    const rawDistractors = getDistractors(currentQuestion, vocabList, 3);
    const options = [
      { vocab: currentQuestion, isCorrect: true },
      ...rawDistractors.map(d => ({ vocab: d, isCorrect: false }))
    ].sort(() => Math.random() - 0.5);

    // Speed multiplier based on difficulty
    let speedBase = 0.7;
    if (difficulty === "easy") speedBase = 0.4;
    if (difficulty === "hard") speedBase = 1.2;

    // Build asteroid list
    const newAsteroids: Asteroid[] = options.map((opt, i) => {
      // Calculate evenly spaced columns (0, 1, 2, 3)
      const colWidth = containerWidth / 4;
      const baseX = colWidth * i + colWidth / 2;

      // Spawn in the upper half of screen (e.g. Y from 50 to 180) to avoid immediate crash
      const spawnY = 50 + Math.random() * 130;
      // Slightly randomize column center
      const offsetX = (Math.random() - 0.5) * (colWidth * 0.4);

      // Determine asteroid text based on mode
      let displayText = "";
      if (studyType === "word-to-meaning") {
        displayText = opt.vocab.definition;
      } else if (studyType === "meaning-to-word" || studyType === "listening") {
        displayText = opt.vocab.word;
      }

      // Generate random movement angle (directed downwards between 27 and 153 degrees) and speed
      const speed = speedBase * (1.2 + Math.random() * 0.6);
      const angle = 0.15 * Math.PI + Math.random() * 0.7 * Math.PI;
      const vx = Math.cos(angle) * speed;
      const vy = Math.sin(angle) * speed;

      const size = getAsteroidSize(displayText);

      return {
        id: `ast-${i}-${Date.now()}`,
        vocab: opt.vocab,
        text: displayText,
        size,
        x: baseX + offsetX - size / 2, // center alignment offset
        y: spawnY,
        vx,
        vy,
        speed,
        column: i,
        isCorrect: opt.isCorrect,
        isDestroyed: false
      };
    });

    setAsteroids(newAsteroids);
    setIsWaitingNext(false);
  }, [studyType, difficulty, vocabList, playSpeech]);

  // Start the game loop
  const startGame = () => {
    if (vocabList.length < 2) {
      toast.error("Bài học cần ít nhất 2 từ vựng để chơi game");
      return;
    }

    // Select vocab queue
    const queue = [...vocabList].sort(() => Math.random() - 0.5);

    setQuestionsQueue(queue);
    setCurrentQuestionIdx(0);
    setScore(0);
    setHp(3);
    setCombo(0);
    setMaxCombo(0);
    setIncorrectList([]);
    setIsWaitingNext(false);
    setStartTime(Date.now());
    setGameState("PLAYING");

    // Spawn first question
    spawnQuestionAsteroids(0, queue);
  };

  // End Game & Show Results
  const endGame = useCallback(async (isCompleted: boolean) => {
    setGameState("RESULT");
    if (gameLoopRef.current) {
      cancelAnimationFrame(gameLoopRef.current);
      gameLoopRef.current = null;
    }

    // Play end game chime
    if (isCompleted && hp > 0) {
      soundSynth.playVictory();
      toast.success("🚀 Khôi phục căn cứ thành công! Chiến thắng vẻ vang.");
    } else {
      soundSynth.playGameOver();
      toast.error("💥 Phi thuyền đã cạn nhiên liệu/bị rơi. Nhiệm vụ thất bại!");
    }

    // Write statistics to history
    const elapsedSeconds = Math.round((Date.now() - startTime) / 1000);
    if (user?.uid && elapsedSeconds > 0) {
      await historyService.incrementStudyStats(user.uid, "review", elapsedSeconds);
    }
  }, [startTime, user, hp]);

  // Spawns a single asteroid object at boundary
  const createAsteroidObject = useCallback((vocabItem: VocabItem, isCorrect: boolean): Asteroid => {
    let speedBase = 0.7;
    if (difficulty === "easy") speedBase = 0.4;
    if (difficulty === "hard") speedBase = 1.2;

    const wall = Math.floor(Math.random() * 3);
    const speed = speedBase * (1.2 + Math.random() * 0.6);
    let x = 0;
    let y = 0;
    let vx = 0;
    let vy = 0;

    let displayText = "";
    if (studyType === "word-to-meaning") {
      displayText = vocabItem.definition;
    } else {
      displayText = vocabItem.word;
    }

    const size = getAsteroidSize(displayText);

    if (wall === 0) {
      // Spawn Left (start partially on-screen at x = -size / 2)
      x = -size / 2;
      y = 60 + Math.random() * 180;
      vx = speed * (1.0 + Math.random() * 0.5);
      vy = speed * (Math.random() - 0.5) * 0.5;
    } else if (wall === 1) {
      // Spawn Right (start partially on-screen)
      x = containerWidth - size / 2;
      y = 60 + Math.random() * 180;
      vx = -speed * (1.0 + Math.random() * 0.5);
      vy = speed * (Math.random() - 0.5) * 0.5;
    } else {
      // Spawn Top (start partially on-screen at y = -10)
      x = 100 + Math.random() * 600;
      y = -10;
      vx = speed * (Math.random() - 0.5) * 0.5;
      vy = speed * (1.0 + Math.random() * 0.5);
    }

    return {
      id: `ast-repl-${isCorrect ? "corr" : "dist"}-${Date.now()}-${Math.random()}`,
      vocab: vocabItem,
      text: displayText,
      size,
      x,
      y,
      vx,
      vy,
      speed,
      column: -1,
      isCorrect,
      isDestroyed: false
    };
  }, [difficulty, studyType]);

  // Spawns a single replacement asteroid (helper)
  const createReplacementAsteroid = useCallback((isCorrect: boolean): Asteroid => {
    const currentQuestion = questionsQueue[currentQuestionIdx];
    if (!currentQuestion) {
      return {
        id: `ast-repl-dummy-${Date.now()}-${Math.random()}`,
        vocab: { word: "dummy", definition: "dummy" },
        text: "dummy",
        size: 110,
        x: 0, y: -100, vx: 0, vy: 1, speed: 1, column: -1, isCorrect: false, isDestroyed: false
      };
    }

    let vocabItem: VocabItem;
    if (isCorrect) {
      vocabItem = currentQuestion;
    } else {
      const rawDistractors = getDistractors(currentQuestion, vocabList, 1);
      vocabItem = rawDistractors[0];
    }

    return createAsteroidObject(vocabItem, isCorrect);
  }, [questionsQueue, currentQuestionIdx, vocabList, createAsteroidObject]);

  // Asteroid Physics Engine Loop (Updates coordinates of flying asteroids)
  useEffect(() => {
    if (gameState !== "PLAYING" || isWaitingNext) return;

    let lastTime = performance.now();
    const frameRateFactor = 16.666; // 60fps frame duration

    const updatePhysics = (time: number) => {
      const delta = Math.min((time - lastTime) / frameRateFactor, 4.0);
      lastTime = time;

      setAsteroids(prev => {
        let spawnCorrect = false;
        let spawnDistractorCount = 0;

        const updated = prev.map(ast => {
          if (ast.isDestroyed) return ast;

          // Calculate next position
          const nextX = ast.x + ast.vx * delta;
          const nextY = ast.y + ast.vy * delta;

          // Check if it goes out of bounds:
          // X: less than -180 or greater than 810
          // Y: less than -80 or greater than 490
          const outOfBounds = nextX < -180 || nextX > 810 || nextY < -80 || nextY > 490;

          if (outOfBounds) {
            if (ast.isCorrect) {
              spawnCorrect = true;
            } else {
              spawnDistractorCount++;
            }
            return { ...ast, isDestroyed: true };
          }

          return {
            ...ast,
            x: nextX,
            y: nextY
          };
        });

        // Keep only active (non-destroyed) asteroids in state
        const active = updated.filter(ast => !ast.isDestroyed);

        // Generate replacement objects synchronously inside the state updater
        const replacements: Asteroid[] = [];
        if (spawnCorrect) {
          replacements.push(createReplacementAsteroid(true));
        }
        for (let i = 0; i < spawnDistractorCount; i++) {
          replacements.push(createReplacementAsteroid(false));
        }

        return [...active, ...replacements];
      });

      gameLoopRef.current = requestAnimationFrame(updatePhysics);
    };

    gameLoopRef.current = requestAnimationFrame(updatePhysics);
    return () => {
      if (gameLoopRef.current) cancelAnimationFrame(gameLoopRef.current);
    };
  }, [gameState, isWaitingNext, containerWidth, containerHeight, createReplacementAsteroid]);

  // Rotate ship towards mouse pointer inside the container
  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (gameState !== "PLAYING" || isWaitingNext) return;
    if (!containerRef.current) return;

    const rect = containerRef.current.getBoundingClientRect();
    const mouseX = e.clientX - rect.left;
    const mouseY = e.clientY - rect.top;

    // Convert DOM mouse coordinates to virtual coordinate space (800x600)
    const scaleX = containerWidth / rect.width;
    const scaleY = containerHeight / rect.height;

    const gameMouseX = mouseX * scaleX;
    const gameMouseY = mouseY * scaleY;

    // Ship center coordinates in virtual space
    const shipX = containerWidth / 2;
    const shipY = containerHeight - 50;

    const angleRad = Math.atan2(gameMouseY - shipY, gameMouseX - shipX);
    const angleDeg = angleRad * (180 / Math.PI) + 90;

    let normAngle = angleDeg;
    if (normAngle > 180) normAngle -= 360;

    // Constrain angle between -90 and 90 degrees
    const constrainedAngle = Math.max(-90, Math.min(90, normAngle));
    setRotation(constrainedAngle);
  };

  // Trigger click on an asteroid
  const handleAsteroidClick = (clickedAst: Asteroid) => {
    if (laser.active || clickedAst.isDestroyed || isWaitingNext) return;

    const currentQuestion = questionsQueue[currentQuestionIdx];
    const shipX = containerWidth / 2;
    const shipY = containerHeight - 50;
    const astCenterX = clickedAst.x + clickedAst.size / 2;
    const astCenterY = clickedAst.y + clickedAst.size / 2;

    // Calculate rotation angle one final time just in case mouse was too fast
    const angleRad = Math.atan2(astCenterY - shipY, astCenterX - shipX);
    const angleDeg = angleRad * (180 / Math.PI) + 90;
    let normAngle = angleDeg;
    if (normAngle > 180) normAngle -= 360;
    const constrainedAngle = Math.max(-90, Math.min(90, normAngle));
    setRotation(constrainedAngle);

    // Fire laser sound
    soundSynth.playLaser();

    // Calculate nose position dynamically based on current rotation
    const rad = (constrainedAngle * Math.PI) / 180;
    const noseX = shipX + Math.sin(rad) * 45;
    const noseY = shipY - Math.cos(rad) * 45;

    // Trigger Laser Beam graphics
    setLaser({
      active: true,
      fromX: noseX,
      fromY: noseY,
      toX: astCenterX,
      toY: astCenterY
    });

    // Handle projectile motion gif overlay (traveling bolt)
    setShowLaserGif(true);
    setLaserGifPos({ x: noseX, y: noseY });
    setTimeout(() => {
      setLaserGifPos({ x: astCenterX, y: astCenterY });
    }, 20);

    // Quick laser timeout (beam reaches target)
    setTimeout(() => {
      setLaser(prev => ({ ...prev, active: false }));
      setShowLaserGif(false);
      handleLaserHit(clickedAst, currentQuestion, astCenterX, astCenterY);
    }, 180);
  };

  // Handle laser beam impact
  const handleLaserHit = (
    clickedAst: Asteroid,
    currentQuestion: VocabItem,
    hitX: number,
    hitY: number
  ) => {
    const isCorrect = clickedAst.isCorrect;

    if (isCorrect) {
      // CORRECT CHOICE
      soundSynth.playExplosion();
      createExplosion(hitX, hitY, "rgb(34, 197, 94)"); // green particles

      // Update score and combo
      const nextCombo = combo + 1;
      setCombo(nextCombo);
      setMaxCombo(prev => Math.max(prev, nextCombo));

      const points = 100 * (nextCombo > 5 ? 3 : nextCombo > 2 ? 2 : 1);
      setScore(prev => prev + points);

      // Play combo sound on multiples of 5
      if (nextCombo > 0 && nextCombo % 5 === 0) {
        soundSynth.playCombo();
        toast.success(`Combo x${nextCombo}! 🌟`, { id: "combo-toast" });
      }

      // 1. Find if any of the remaining flying asteroids' vocabularies are in the remaining queue
      const remainingAsteroidsForQueue = asteroids.filter(a => a.id !== clickedAst.id && !a.isDestroyed);
      const remainingVocabWords = remainingAsteroidsForQueue.map(a => a.vocab.word);

      const nextIdx = currentQuestionIdx + 1;
      let foundIdx = -1;
      for (let i = nextIdx; i < questionsQueue.length; i++) {
        if (remainingVocabWords.includes(questionsQueue[i].word)) {
          foundIdx = i;
          break;
        }
      }

      let activeQueue = questionsQueue;
      if (foundIdx !== -1 && foundIdx !== nextIdx) {
        const newQueue = [...questionsQueue];
        const temp = newQueue[nextIdx];
        newQueue[nextIdx] = newQueue[foundIdx];
        newQueue[foundIdx] = temp;
        setQuestionsQueue(newQueue);
        activeQueue = newQueue;
      }

      if (nextIdx >= activeQueue.length) {
        // If we reached the end of the queue, end the game!
        // Remove the hit asteroid immediately and wait a brief moment for the explosion to complete.
        setAsteroids(prev => prev.filter(a => a.id !== clickedAst.id));
        setTimeout(() => {
          endGame(true);
        }, 600);
        return;
      }

      // Advance question index state
      setCurrentQuestionIdx(nextIdx);

      // Play voice for the next question automatically in Listening Mode
      const nextQuestion = activeQueue[nextIdx];
      if (studyType === "listening") {
        playSpeech(nextQuestion.word);
      }

      // 2. Update the active asteroids state atomically without clearing the screen
      setAsteroids(prev => {
        // Filter out the hit correct asteroid and any destroyed ones
        const remaining = prev.filter(a => a.id !== clickedAst.id && !a.isDestroyed);
        const currentRemainingVocabWords = remaining.map(a => a.vocab.word);

        // Check if the next question is already represented by one of the remaining asteroids
        const hasCorrectOnScreen = currentRemainingVocabWords.includes(nextQuestion.word);

        const updatedAsteroids: Asteroid[] = [];

        // Update existing flying asteroids: keep their text & vocab, only update correctness flag!
        remaining.forEach(ast => {
          const isAstCorrect = ast.vocab.word === nextQuestion.word;
          updatedAsteroids.push({
            ...ast,
            isCorrect: isAstCorrect
          });
        });

        // Spawn new asteroids to reach exactly 4 asteroids on screen
        const numToSpawn = 4 - remaining.length;
        if (numToSpawn > 0) {
          const spawnedAsteroids: Asteroid[] = [];

          if (!hasCorrectOnScreen) {
            // We must spawn the correct answer as one of the new asteroids
            spawnedAsteroids.push(createAsteroidObject(nextQuestion, true));

            // The rest of the spawned ones (if any) are distractors
            if (numToSpawn > 1) {
              const currentOnScreenWords = [...currentRemainingVocabWords, nextQuestion.word];
              const distractors = getDistractorsExcluded(nextQuestion, vocabList, currentOnScreenWords, numToSpawn - 1);
              distractors.forEach(d => {
                spawnedAsteroids.push(createAsteroidObject(d, false));
              });
            }
          } else {
            // The correct answer is already on the screen, so all spawned ones are distractors
            const distractors = getDistractorsExcluded(nextQuestion, vocabList, currentRemainingVocabWords, numToSpawn);
            distractors.forEach(d => {
              spawnedAsteroids.push(createAsteroidObject(d, false));
            });
          }

          updatedAsteroids.push(...spawnedAsteroids);
        }

        return updatedAsteroids;
      });

    } else {
      // INCORRECT CHOICE
      soundSynth.playExplosion();
      createExplosion(hitX, hitY, "rgb(239, 68, 68)"); // red particles

      // Decrease HP
      setHp(prev => {
        const nextHp = prev - 1;
        if (nextHp <= 0) {
          endGame(false);
        }
        return nextHp;
      });

      // Reset Combo
      setCombo(0);

      // Record wrong answer
      setIncorrectList(prev => {
        if (prev.some(item => item.word === currentQuestion.word)) return prev;
        return [...prev, currentQuestion];
      });



      // Mark this specific asteroid as destroyed and spawn a replacement distractor synchronously
      setAsteroids(prev => {
        const remaining = prev.filter(a => a.id !== clickedAst.id);
        const replacement = createReplacementAsteroid(false);
        return [...remaining, replacement];
      });

      // Trigger Screen Shake
      setShake(true);
      setTimeout(() => setShake(false), 200);
    }
  };

  // Helper for displaying current question content based on studyType
  const renderQuestionBox = () => {
    const currentQuestion = questionsQueue[currentQuestionIdx];
    if (!currentQuestion) return null;

    switch (studyType) {
      case "word-to-meaning":
        return (
          <div className="text-center">
            <h2 className="text-2xl font-extrabold text-white drop-shadow-md select-none">{currentQuestion.word}</h2>
            {currentQuestion.ipa && <p className="text-xs font-mono text-cyan-400 mt-0.5 select-none">/{currentQuestion.ipa}/</p>}
          </div>
        );
      case "meaning-to-word":
        return (
          <div className="text-center px-2">
            <p className="text-[10px] uppercase tracking-wider text-amber-500 font-semibold mb-0.5">Tìm từ vựng tương ứng</p>
            <h2 className="text-sm font-bold text-white drop-shadow-md leading-relaxed select-none max-h-12 overflow-y-auto">{currentQuestion.definition}</h2>
          </div>
        );
      case "listening":
        return (
          <div className="text-center flex flex-col items-center">
            <p className="text-[10px] uppercase tracking-wider text-amber-500 font-semibold mb-1">Nghe và chọn từ đúng</p>
            <button
              onClick={() => playSpeech(currentQuestion.word)}
              className="flex items-center gap-1.5 px-4 py-1.5 bg-cyan-600 hover:bg-cyan-500 text-white rounded-full font-semibold shadow-lg hover:shadow-cyan-500/20 active:scale-95 transition-all text-xs cursor-pointer"
            >
              <Volume2 className="h-4 w-4" /> Phát âm từ vựng
            </button>
          </div>
        );

      default:
        return null;
    }
  };

  // Loading indicator
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[70vh]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-4 border-claude-border border-t-claude-accent mx-auto mb-4"></div>
          <p className="text-claude-text-2 font-medium">Đang tải dữ liệu vũ trụ...</p>
        </div>
      </div>
    );
  }

  if (!lesson) {
    return (
      <div className="max-w-2xl mx-auto py-12 px-6 text-center">
        <AlertCircle className="h-16 w-16 text-claude-error mx-auto mb-4" />
        <h2 className="text-2xl font-bold text-claude-text mb-2">Không tìm thấy bài học</h2>
        <button onClick={() => navigate(fromPath)} className="mt-4 px-4 py-2 bg-claude-accent text-white rounded">
          Quay lại
        </button>
      </div>
    );
  }


  return (
    <div className={`w-full flex flex-col items-center justify-center animate-fade-in relative z-10 select-none bg-slate-950 ${gameState === "PLAYING" ? "h-full p-0" : "min-h-[calc(100vh-56px)] md:min-h-screen p-4 md:p-6"
      }`}>

      {/* ────────────────────────────────────────────────────────
         LOBBY SETUP SCREEN
      ──────────────────────────────────────────────────────── */}
      {gameState === "LOBBY" && (
        <div className="w-full max-w-4xl bg-slate-900 border border-slate-800 rounded-2xl shadow-xl p-6 md:p-8 relative overflow-hidden my-auto">

          <button
            onClick={() => navigate(fromPath)}
            className="flex items-center gap-2 text-slate-400 hover:text-white transition-colors text-sm mb-6 font-medium cursor-pointer"
          >
            <ArrowLeft className="h-4 w-4" /> Trở lại bài học
          </button>

          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-white tracking-tight">ASTEROID MATCH</h1>
            <p className="text-slate-400 text-sm mt-1">
              Điều khiển phi thuyền tiêu diệt thiên thạch chứa đáp án chính xác để bảo vệ căn cứ!
            </p>
            <div className="mt-3 inline-block px-3 py-1 bg-slate-800 text-xs text-slate-300 rounded-full border border-slate-700">
              Bài học: {lesson.title}
            </div>
          </div>

          <div className="space-y-6">
            {/* 1. Select Study Mode */}
            <div>
              <label className="block text-slate-300 font-semibold text-sm uppercase tracking-wider mb-3">
                1. Chọn chế độ chơi
              </label>
              <div className="grid grid-cols-3 gap-3">
                {[
                  { id: "word-to-meaning", title: "Từ → Nghĩa", desc: "Bắn thiên thạch chứa nghĩa tiếng Việt đúng" },
                  { id: "meaning-to-word", title: "Nghĩa → Từ", desc: "Bắn thiên thạch chứa từ tiếng Anh đúng" },
                  { id: "listening", title: "Chế độ Nghe", desc: "Nghe phát âm tiếng Anh và bắn từ đúng" }
                ].map(mode => (
                  <button
                    key={mode.id}
                    onClick={() => setStudyType(mode.id as StudyType)}
                    className={`p-4 text-left rounded-xl border transition-all duration-200 cursor-pointer ${studyType === mode.id
                      ? "bg-slate-800 border-slate-600 text-white"
                      : "bg-slate-950/40 border-slate-800 text-slate-400 hover:border-slate-700 hover:text-slate-200"
                      }`}
                  >
                    <div className="font-bold text-sm flex items-center gap-1.5">
                      <Sparkles className="h-4 w-4 text-slate-400" />
                      {mode.title}
                    </div>
                    <div className="text-[11px] mt-1 leading-normal opacity-80">{mode.desc}</div>
                  </button>
                ))}
              </div>
            </div>

            {/* 2. Select Difficulty */}
            <div>
              <label className="block text-slate-300 font-semibold text-sm uppercase tracking-wider mb-2.5">
                2. Chọn độ khó (Tốc độ rơi)
              </label>
              <div className="flex gap-2.5">
                {[
                  { id: "easy", label: "Dễ", style: "hover:border-slate-700 hover:text-slate-200" },
                  { id: "medium", label: "Trung bình", style: "hover:border-slate-700 hover:text-slate-200" },
                  { id: "hard", label: "Khó", style: "hover:border-slate-700 hover:text-slate-200" }
                ].map(diff => (
                  <button
                    key={diff.id}
                    onClick={() => setDifficulty(diff.id as Difficulty)}
                    className={`flex-1 py-3 px-4 rounded-xl border text-sm font-semibold transition-all cursor-pointer ${difficulty === diff.id
                      ? "bg-slate-800 border-slate-600 text-white"
                      : `bg-slate-950/40 border-slate-800 text-slate-400 ${diff.style}`
                      }`}
                  >
                    {diff.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Start Button */}
            <button
              onClick={startGame}
              className="w-full flex items-center justify-center gap-2 bg-amber-600 hover:bg-amber-500 text-white font-bold text-base py-3.5 rounded-xl transition-all cursor-pointer mt-2"
            >
              <Gamepad2 className="h-5 w-5" /> BẮT ĐẦU PHI VỤ
            </button>
          </div>
        </div>
      )}

      {/* ────────────────────────────────────────────────────────
         GAMEPLAY CANVAS ARENA
      ──────────────────────────────────────────────────────── */}
      {gameState === "PLAYING" && (
        <div className="w-full h-full flex flex-col items-center justify-between p-4 md:p-6">

          {/* Core Arena Box */}
          <div
            ref={containerRef}
            onMouseMove={handleMouseMove}
            className={`w-full flex-1 bg-slate-950 rounded-3xl border border-slate-800 shadow-2xl relative overflow-hidden select-none select-none ${shake ? "animate-shake" : ""
              }`}
            style={{ contentVisibility: "auto" }}
          >
            {/* Background Canvas (Stars and Particle explosions) */}
            <canvas ref={canvasRef} className="absolute inset-0 pointer-events-none z-0" />

            {/* Unified Holographic HUD & Question Box Console */}
            <div className="absolute top-4 inset-x-4 md:inset-x-8 bg-transparent p-3 z-10 animate-fade-in text-white select-none flex justify-between items-center gap-4">

              {/* Left Panel: Lives & Progress */}
              <div className="flex flex-col items-start gap-1 min-w-[120px]">
                <div className="flex items-center gap-1.5">
                  <Heart className="h-4 w-4 fill-red-500 text-red-500 filter drop-shadow-[0_0_3px_rgba(239,68,68,0.5)] animate-pulse" />
                  <span className="font-mono text-sm font-black text-red-400">x{hp}</span>
                </div>
                <div className="font-mono text-[10px] text-slate-400 tracking-wider">
                  PROGRESS: <span className="font-bold text-cyan-400">{currentQuestionIdx + 1}/{questionsQueue.length}</span>
                </div>
              </div>

              {/* Center Panel: The Question Target */}
              <div className="flex-1 flex justify-center py-1 px-4">
                {renderQuestionBox()}
              </div>

              {/* Right Panel: Score & Combo */}
              <div className="flex flex-col items-end gap-1 min-w-[120px]">
                <div className="font-mono text-[10px] text-slate-400 tracking-wider">
                  SCORE: <span className="font-bold text-amber-500">{String(score).padStart(6, "0")}</span>
                </div>
                {combo > 1 && (
                  <div className="bg-amber-500/20 border border-amber-500/30 px-2 py-0.5 rounded text-[10px] font-bold text-amber-400 animate-bounce">
                    COMBO x{combo} 🌟
                  </div>
                )}
              </div>

            </div>

            {/* Target Laser Beam Lines */}
            {laser.active && (
              <svg className="absolute inset-0 w-full h-full pointer-events-none z-20" viewBox="0 0 800 600" preserveAspectRatio="none">
                {/* 1. Wide outer reddish glow */}
                <line
                  x1={laser.fromX}
                  y1={laser.fromY}
                  x2={laser.toX}
                  y2={laser.toY}
                  stroke="rgba(239, 68, 68, 0.4)"
                  strokeWidth="8"
                  strokeLinecap="round"
                />
                {/* 2. Core orange laser beam */}
                <line
                  x1={laser.fromX}
                  y1={laser.fromY}
                  x2={laser.toX}
                  y2={laser.toY}
                  stroke="rgb(249, 115, 22)"
                  strokeWidth="4"
                  strokeLinecap="round"
                />
                {/* 3. Laser thin white hot center */}
                <line
                  x1={laser.fromX}
                  y1={laser.fromY}
                  x2={laser.toX}
                  y2={laser.toY}
                  stroke="#ffffff"
                  strokeWidth="1.5"
                  strokeLinecap="round"
                />
              </svg>
            )}

            {/* Laser Traveling GIF */}
            {showLaserGif && (
              <img
                src={laserGif}
                alt="Laser Bolt"
                className="absolute w-8 h-8 pointer-events-none z-30 transform -translate-x-1/2 -translate-y-1/2"
                style={{
                  left: `${(laserGifPos.x / containerWidth) * 100}%`,
                  top: `${(laserGifPos.y / containerHeight) * 100}%`,
                  transition: "all 0.15s linear",
                  transform: `translate(-50%, -50%) rotate(${rotation}deg)`
                }}
              />
            )}

            {/* Floating / Falling Asteroids */}
            {asteroids.map(ast => {
              if (ast.isDestroyed) return null;

              return (
                <div
                  key={ast.id}
                  onClick={() => handleAsteroidClick(ast)}
                  className="absolute aspect-square flex items-center justify-center p-2 text-center cursor-pointer select-none z-10 active:scale-95 transition-transform"
                  style={{
                    left: `${(ast.x / containerWidth) * 100}%`,
                    top: `${(ast.y / containerHeight) * 100}%`,
                    width: `${(ast.size / containerWidth) * 100}%`
                  }}
                >
                  {/* Real Asteroid Image Background */}
                  <img
                    src={asteroidImg}
                    alt="Asteroid Space Rock"
                    className="absolute inset-0 w-full h-full object-contain pointer-events-none select-none filter drop-shadow-[0_4px_6px_rgba(0,0,0,0.4)]"
                  />

                  <span className="text-[11px] font-bold text-amber-100 select-none leading-normal relative z-10 drop-shadow-[0_1.5px_1.5px_rgba(0,0,0,0.9)] px-3 break-words whitespace-normal text-center max-w-[65%] flex flex-col gap-0.5 items-center justify-center">
                    {ast.text.includes(" | ") ? (
                      <>
                        <span className="opacity-95">{ast.text.split(" | ")[0]}</span>
                        <span className="text-[10px] text-amber-200/80 font-medium border-t border-amber-300/10 pt-0.5 mt-0.5 max-w-[95%]">
                          {ast.text.split(" | ")[1]}
                        </span>
                      </>
                    ) : (
                      ast.text
                    )}
                  </span>
                </div>
              );
            })}

            {/* Bottom Base Shield Boundary Line */}
            <div className="absolute bottom-[18.3%] inset-x-0 h-[1px] bg-gradient-to-r from-transparent via-cyan-500/20 to-transparent flex items-center justify-center">
              <span className="bg-slate-950 px-3 text-[10px] text-cyan-500/40 tracking-wider uppercase font-semibold">
                Base Shield Boundary
              </span>
            </div>

            {/* Spaceship (Centered horizontally at bottom) */}
            <div
              className="absolute bottom-2 left-1/2 transform -translate-x-1/2 w-24 h-24 flex flex-col items-center pointer-events-none z-30"
              style={{
                transform: `translateX(-50%) rotate(${rotation}deg)`,
                transition: "transform 0.08s ease-out"
              }}
            >
              {/* Thruster Flame glow effect */}
              {gameState === "PLAYING" && !isWaitingNext && (
                <div className="absolute bottom-[-15px] w-6 h-12 bg-gradient-to-t from-transparent via-orange-500 to-amber-300 rounded-full blur-[2px] animate-pulse" />
              )}

              <img
                src={airplaneImg}
                alt="Spaceship Fighter"
                className="w-20 h-20 object-contain filter drop-shadow-[0_4px_6px_rgba(0,0,0,0.3)]"
              />
            </div>

          </div>

          {/* Quick Exit option */}
          <button
            onClick={() => endGame(false)}
            className="mt-4 flex items-center gap-1.5 text-xs text-slate-500 hover:text-slate-300 transition-colors cursor-pointer font-semibold"
          >
            <XCircle className="h-4 w-4" /> Bỏ cuộc giữa chừng
          </button>
        </div>
      )}

      {/* ────────────────────────────────────────────────────────
         RESULT / STATS SUMMARY SCREEN
      ──────────────────────────────────────────────────────── */}
      {gameState === "RESULT" && (
        <div className="w-full max-w-4xl bg-slate-900 border border-slate-800 rounded-2xl shadow-xl p-6 md:p-8 relative overflow-hidden my-auto">

          <div className="text-center mb-6">
            <h1 className="text-3xl font-bold text-white">
              {hp > 0 ? "BÁO CÁO THẮNG LỢI" : "PHI THUYỀN BỊ NỔ"}
            </h1>
            <p className="text-slate-400 text-xs mt-1 uppercase tracking-wider font-semibold">
              {hp > 0 ? "Bảo vệ căn cứ thành công!" : "Trận chiến không thành công"}
            </p>
          </div>

          {/* Score cards grid */}
          <div className="grid grid-cols-3 gap-3 mb-6 text-center">
            <div className="bg-slate-950 border border-slate-800 p-3 rounded-xl">
              <span className="text-[10px] text-slate-400 font-bold uppercase block tracking-wider">Điểm số</span>
              <span className="text-2xl font-bold text-amber-500 mt-1 block select-all">{score}</span>
            </div>
            <div className="bg-slate-950 border border-slate-800 p-3 rounded-xl">
              <span className="text-[10px] text-slate-400 font-bold uppercase block tracking-wider">Combo cao nhất</span>
              <span className="text-2xl font-bold text-cyan-400 mt-1 block select-all">x{maxCombo}</span>
            </div>
            <div className="bg-slate-950 border border-slate-800 p-3 rounded-xl">
              <span className="text-[10px] text-slate-400 font-bold uppercase block tracking-wider">Thời gian</span>
              <span className="text-2xl font-bold text-slate-200 mt-1 block">
                {Math.floor((Date.now() - startTime) / 1000)}s
              </span>
            </div>
          </div>

          {/* Wrong answers recap */}
          <div className="mb-6">
            <h2 className="text-xs uppercase tracking-wider text-slate-300 font-bold mb-3 flex items-center gap-1.5">
              <AlertCircle className="h-4 w-4 text-amber-500" />
              Từ vựng cần lưu ý ({incorrectList.length})
            </h2>

            {incorrectList.length === 0 ? (
              <div className="bg-green-600/10 border border-green-500/20 p-5 rounded-xl text-center">
                <CheckCircle2 className="h-10 w-10 text-green-500 mx-auto mb-2" />
                <p className="text-green-400 font-bold text-sm">BẮN HẠ 100% HOÀN HẢO!</p>
                <p className="text-slate-400 text-xs mt-0.5">Bạn không trả lời sai bất kỳ từ vựng nào.</p>
              </div>
            ) : (
              <div className="bg-slate-950 border border-slate-800 rounded-xl overflow-hidden max-h-52 overflow-y-auto">
                <table className="w-full text-left">
                  <thead className="bg-slate-950 text-[10px] uppercase font-bold text-slate-400 tracking-wider">
                    <tr>
                      <th className="px-4 py-2">Từ vựng</th>
                      <th className="px-4 py-2">Phiên âm</th>
                      <th className="px-4 py-2">Nghĩa đầy đủ</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800 text-xs text-slate-300">
                    {incorrectList.map((item, index) => (
                      <tr key={index} className="hover:bg-slate-800/30">
                        <td className="px-4 py-3 font-bold text-white select-all">{item.word}</td>
                        <td className="px-4 py-3 text-cyan-400">/{item.ipa || "—"}/</td>
                        <td className="px-4 py-3 text-slate-400">{item.definition}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* Footer buttons */}
          <div className="flex gap-3 mt-4">
            <button
              onClick={startGame}
              className="flex-1 flex items-center justify-center gap-2 py-3 bg-amber-600 hover:bg-amber-500 text-white rounded-xl font-bold transition-all active:scale-95 cursor-pointer"
            >
              <RotateCcw className="h-4 w-4" /> Chơi lại màn này
            </button>
            <button
              onClick={() => navigate(fromPath)}
              className="flex-1 flex items-center justify-center gap-2 py-3 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl font-bold transition-all border border-slate-700 active:scale-95 cursor-pointer"
            >
              <ArrowLeft className="h-4 w-4" /> Trở về bài học
            </button>
          </div>

        </div>
      )}

    </div>
  );
};

export default AsteroidMatch;
