"use client";

import { Button } from "@/components/atoms/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/atoms/dropdown-menu";
import {
  InputOTP,
  InputOTPGroup,
  InputOTPSlot,
} from "@/components/atoms/input-otp";
import { REGEXP_ONLY_CHARS } from "input-otp";
import { Moon, Sun } from "lucide-react";
import { useTheme } from "next-themes";
import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";

type CharObject = {
  [key: string]: number[];
};

type ColorArray = {
  [key: string]: string[];
};

type RowColorObject = {
  [key: number]: ColorArray;
};

export default function Home() {
  const inputRefs = Array.from({ length: 6 }, () =>
    useRef<HTMLInputElement>(null)
  );

  const { setTheme } = useTheme();
  const [wordToGuess, setWordToGuess] = useState<string>("");
  const [activeRow, setActiveRow] = useState<number>(0);
  const [currentInput, setCurrentInput] = useState("");
  const [wordToGuessCharObject, setWordToGuessCharObject] =
    useState<CharObject>({});
  const [presentColorObject, setPresentColorObject] = useState<RowColorObject>(
    {}
  );

  useEffect(() => {
    async function fetchWordToGuess() {
      const randomWordResponse = await fetch("/api/word?length=5");
      const randomWordJson = await randomWordResponse.json();
      const randomWord: string = randomWordJson[0].toLowerCase();
      setWordToGuess(randomWord);
      const tempCharObject: CharObject = {};
      randomWord.split("").forEach((char, index) => {
        tempCharObject[char] = tempCharObject[char]
          ? [...tempCharObject[char], index]
          : [index];
      });
      setWordToGuessCharObject(tempCharObject);
    }
    fetchWordToGuess();
  }, []);

  const handleChange = (value: string) => {
    setCurrentInput(value);
  };

  const handleEnter = async (event: React.KeyboardEvent<HTMLInputElement>) => {
    if (event.key === "Enter") {
      if (currentInput.length !== wordToGuess.length) {
        toast("Too Short", {
          description: `Word is too short. Please enter a ${wordToGuess.length}-letter word.`,
          action: {
            label: "Dismiss",
            onClick: () => toast.dismiss(),
          },
        });
        return;
      }
      const validateWordResponse = await fetch(
        `/api/validate?word=${currentInput}`
      );
      const validateWord = await validateWordResponse.json();
      if (!validateWord.ok) {
        toast("Invalid Word", {
          description: "The word you entered is not valid. Please try again.",
          action: {
            label: "Dismiss",
            onClick: () => toast.dismiss(),
          },
        });
        return;
      }
      const tempColorObject: RowColorObject = {
        [activeRow]: {
          correct: [],
          present: [],
        },
      };
      currentInput.split("").forEach((char, index) => {
        if (wordToGuessCharObject[char.toLowerCase()]) {
          if (wordToGuessCharObject[char.toLowerCase()].includes(index)) {
            tempColorObject[activeRow] = {
              ...tempColorObject[activeRow],
              correct: [
                ...tempColorObject[activeRow]["correct"],
                `${activeRow}-${index}`,
              ],
            };
          } else {
            tempColorObject[activeRow] = {
              ...tempColorObject[activeRow],
              present: [
                ...tempColorObject[activeRow]["present"],
                `${activeRow}-${index}`,
              ],
            };
          }
        }
      });
      setPresentColorObject(Object.assign(tempColorObject, presentColorObject));
      if (activeRow < 5) {
        setActiveRow((prev) => prev + 1);
        setTimeout(() => {
          inputRefs[activeRow + 1].current?.focus();
        }, 0);
      } else {
        if (currentInput.toLowerCase() === wordToGuess) {
          toast("Brava", {
            description: "Congratulations! You've guessed the word!",
            action: {
              label: "Dismiss",
              onClick: () => toast.dismiss(),
            },
          });
          return;
        } else {
          toast("Game Over", {
            description: "Game Over! You've reached the maximum attempts.",
            action: {
              label: "Dismiss",
              onClick: () => toast.dismiss(),
            },
          });
        }
      }
      if (currentInput.toLowerCase() === wordToGuess) {
        toast("Brava", {
          description: "Congratulations! You've guessed the word!",
          action: {
            label: "Dismiss",
            onClick: () => toast.dismiss(),
          },
        });
        return;
      }
    }
  };

  const handleBlur = (index: number) => {
    setTimeout(() => {
      inputRefs[index].current?.focus();
    }, 10);
  };

  return (
    <div className="h-screen w-screen">
      <header className="flex items-center justify-between w-full p-2">
        <span></span>
        <p className="font-cursive text-3xl text-stone-900 dark:text-stone-50 font-extrabold">
          wordly
        </p>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" size="icon">
              <Sun className="h-[1.2rem] w-[1.2rem] scale-100 rotate-0 transition-all dark:scale-0 dark:-rotate-90" />
              <Moon className="absolute h-[1.2rem] w-[1.2rem] scale-0 rotate-90 transition-all dark:scale-100 dark:rotate-0" />
              <span className="sr-only">Toggle theme</span>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={() => setTheme("light")}>
              Light
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => setTheme("dark")}>
              Dark
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => setTheme("system")}>
              System
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </header>
      <div className="flex items-center justify-center flex-col gap-2 h-full">
        {Array.from({ length: 6 }).map((_, rowIndex) => (
          <InputOTP
            key={rowIndex}
            ref={inputRefs[rowIndex]}
            maxLength={wordToGuess.length}
            pattern={REGEXP_ONLY_CHARS}
            autoFocus={rowIndex === activeRow}
            disabled={rowIndex !== activeRow}
            onChange={handleChange}
            onKeyDown={handleEnter}
            onBlur={() => handleBlur(rowIndex)}
          >
            <InputOTPGroup>
              {Array.from({ length: wordToGuess.length }).map(
                (_, columnIndex) => (
                  <InputOTPSlot
                    key={columnIndex}
                    index={columnIndex}
                    className={
                      presentColorObject[rowIndex]
                        ? presentColorObject[rowIndex]["correct"].includes(
                            `${rowIndex}-${columnIndex}`
                          )
                          ? "bg-green-200 dark:bg-green-900 animate-wiggle"
                          : presentColorObject[rowIndex]["present"].includes(
                              `${rowIndex}-${columnIndex}`
                            )
                          ? "bg-yellow-200 dark:bg-yellow-900 animate-wiggle"
                          : ""
                        : ""
                    }
                  />
                )
              )}
            </InputOTPGroup>
          </InputOTP>
        ))}
      </div>
    </div>
  );
}
