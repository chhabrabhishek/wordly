"use client";

import { Button } from "@/components/atoms/button";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/atoms/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/atoms/dropdown-menu";
import { Input } from "@/components/atoms/input";
import {
  InputOTP,
  InputOTPGroup,
  InputOTPSlot,
} from "@/components/atoms/input-otp";
import { Label } from "@/components/atoms/label";
import { REGEXP_ONLY_CHARS } from "input-otp";
import { Moon, Settings, Sun } from "lucide-react";
import { useTheme } from "next-themes";
import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";

type InputObject = {
  [key: number]: string;
};

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
  const [wordLength, setWordLength] = useState<number>(5);
  const [wordToGuess, setWordToGuess] = useState<string>("");
  const [activeRow, setActiveRow] = useState<number>(0);
  const [currentInput, setCurrentInput] = useState<InputObject>({});
  const [wordToGuessCharObject, setWordToGuessCharObject] =
    useState<CharObject>({});
  const [presentColorObject, setPresentColorObject] = useState<RowColorObject>(
    {}
  );
  const [open, setOpen] = useState<boolean>(false);

  async function fetchWordToGuess(length: number) {
    const tempInput: InputObject = Object.assign({}, currentInput);
    Array.from({ length: 6 }).forEach((_, index) => {
      tempInput[index] = "";
    });
    setCurrentInput(tempInput);
    setPresentColorObject({});
    setActiveRow(0);
    setTimeout(() => {
      inputRefs[0].current?.focus();
    }, 0);
    const randomWordResponse = await fetch(`/api/word?length=${length}`);
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
    toast("new word alert", {
      description: "here's a new word for you",
      action: {
        label: "dismiss",
        onClick: () => toast.dismiss(),
      },
    });
  }

  useEffect(() => {
    fetchWordToGuess(5);
  }, []);

  function handleSubmit() {
    if (wordLength < 4 || wordLength > 9) {
      toast("invalid length", {
        description: "length should be in the range of 4 to 9",
        action: {
          label: "dismiss",
          onClick: () => toast.dismiss(),
        },
      });
      return;
    }
    fetchWordToGuess(wordLength);
    setOpen(false);
  }

  function handleChange(index: number, value: string) {
    setCurrentInput({
      ...currentInput,
      [index]: value,
    });
  }

  async function handleEnter(event: React.KeyboardEvent<HTMLInputElement>) {
    if (event.key === "Enter") {
      if (currentInput[activeRow].length !== wordToGuess.length) {
        toast("too short", {
          description: `word is too short, please enter a ${wordToGuess.length}-letter word.`,
          action: {
            label: "dismiss",
            onClick: () => toast.dismiss(),
          },
        });
        return;
      }
      const validateWordResponse = await fetch(
        `/api/validate?word=${currentInput[activeRow]}`
      );
      const validateWord = await validateWordResponse.json();
      if (!validateWord.ok) {
        toast("invalid word", {
          description: "the word you entered is not valid, please try again.",
          action: {
            label: "dismiss",
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
      currentInput[activeRow].split("").forEach((char, index) => {
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
      if (currentInput[activeRow].toLowerCase() === wordToGuess) {
        toast("brava", {
          description: "congratulations, you've guessed the word",
          action: {
            label: "dismiss",
            onClick: () => toast.dismiss(),
          },
        });
        fetchWordToGuess(wordLength);
        return;
      }
      if (activeRow < 5) {
        setActiveRow((prev) => prev + 1);
        setTimeout(() => {
          inputRefs[activeRow + 1].current?.focus();
        }, 100);
      } else {
        toast("game over", {
          description: "game over, you've reached the maximum attempts",
          action: {
            label: "dismiss",
            onClick: () => toast.dismiss(),
          },
        });
        fetchWordToGuess(wordLength);
      }
    }
  }

  function handleBlur(index: number) {
    setTimeout(() => {
      inputRefs[index].current?.focus();
    }, 10);
  }

  return (
    <div className="h-screen w-screen">
      <header className="flex items-center justify-between w-full p-2">
        <span></span>
        <p className="font-cursive text-3xl text-stone-900 dark:text-stone-50 font-extrabold">
          wordly
        </p>
        <Dialog open={open} onOpenChange={setOpen}>
          <form>
            <DialogTrigger asChild>
              <Settings className="h-[1.5rem] w-[1.5rem]" />
            </DialogTrigger>
            <DialogContent className="sm:max-w-[425px]">
              <DialogHeader>
                <DialogTitle>settings</DialogTitle>
                <DialogDescription>
                  you can change the theme or length of your word
                </DialogDescription>
              </DialogHeader>
              <div className="grid gap-4">
                <div className="grid gap-3">
                  <Label htmlFor="name-1">word length</Label>
                  <Input
                    type="number"
                    inputMode="numeric"
                    defaultValue={5}
                    min={4}
                    max={9}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                      setWordLength(Number.parseInt(e.target.value))
                    }
                  />
                </div>
                <div className="grid gap-3">
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
                </div>
              </div>
              <DialogFooter>
                <DialogClose asChild>
                  <Button variant="outline">Cancel</Button>
                </DialogClose>
                <Button type="submit" onClick={handleSubmit}>
                  Save changes
                </Button>
              </DialogFooter>
            </DialogContent>
          </form>
        </Dialog>
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
            autoComplete="off"
            inputMode="text"
            value={currentInput[rowIndex]}
            onChange={(value) => handleChange(rowIndex, value)}
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
