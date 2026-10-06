# Personal Finance & Subscription Tracker

## 1. Opis projektu

Dorado to aplikacja internetowa do zarządzania dochodami, wydatkami oraz subskrypcjami, działająca po stronie klienta (Client-Side Only). Aplikacja łączy funkcje menedżera finansowego z modułem kontroli płatności cyklicznych (serwisy, subskrypcje, opłaty stałe).

Projekt jest realizowany w ramach przedmiotu "Programowanie Front-end".

## 2. Cel i założenia projektu

- **Główny cel:** Stworzenie narzędzia do kontroli osobistych finansów bez użycia zewnętrznych serwerów czy złożonych arkuszy kalkulacyjnych.
- **Założenia techniczne:** Stworzenie responsywnego interfejsu użytkownika (UI/UX) z wykorzystaniem technologii front-endowych. Wszystkie dane są przechowywane i przetwarzane lokalnie w przeglądarce.

## 3. Funkcjonalności

### 3.1. Śledzenie przychodów i wydatków

- **Ewidencja dochodów:** Rejestrowanie comiesięcznego wynagrodzenia oraz dodatkowych źródeł przychodu.
- **Kategoryzacja wydatków:** Dodawanie transakcji z przypisaniem do kategorii (Jedzenie, Odzież, Rozrywka, Subskrypcje, Transport, Rachunki).
- **Cykliczny okres budżetowy:** Przeliczanie bilansu na nowy miesiąc (rozpoczynający się pierwszego dnia miesiąca).
- **Historia transakcji:** Lista operacji z możliwością filtrowania, wyszukiwania i edycji.

### 3.2. Menedżer subskrypcji

- **Śledzenie opłat cyklicznych:** Ewidencja planów subskrypcyjnych z uwzględnieniem kwoty i częstotliwości rozliczeń.
- **Kalendarz płatności:** Wizualizacja nadchodzących opłat.
- **Analiza użytkowania:** Ocena częstotliwości korzystania z usług oraz identyfikacja nieużywanych subskrypcji.
- **Asystent rezygnacji:** Instrukcje i odnośniki ułatwiające anulowanie subskrypcji.

### 3.3. Analityka i wizualizacja

- **Pulpit główny (Dashboard):** Wykresy przedstawiające stosunek przychodów do wydatków w wybranym okresie.
- **Struktura wydatków:** Wykresy kołowe i słupkowe pokazujące podział środków według kategorii.
- **Prognoza salda:** Szacowanie dostępnych środków do końca miesiąca na podstawie stałych opłat i średnich wydatków.

## 4. Stos technologiczny

Projekt jest realizowany wyłącznie na Front-endzie.

| Kategoria                       | Technologia                  | Uzasadnienie wyboru                                                              |
| ------------------------------- | ---------------------------- | -------------------------------------------------------------------------------- |
| **Narzędzie budowania & Rdzeń** | **React + Vite**             | Szybkie budowanie projektu i obsługa HMR.                                        |
| **Język programowania**         | **TypeScript**               | Ścisłe typowanie danych finansowych (`Transaction`, `Subscription`, `Category`). |
| **Stylizowanie**                | **Tailwind CSS**             | Szybkie tworzenie układu stron i spójny, responsywny wygląd.                     |
| **Komponenty UI**               | **Shadcn UI + Lucide Icons** | Gotowe komponenty interfejsu i ikony.                                            |
| **Zarządzanie stanem**          | **Zustand**                  | Lekki magazyn stanu z łatwą integracją z LocalStorage.                           |
| **Wykresy**                     | **Recharts**                 | Biblioteka do tworzenia wykresów dla Reacta.                                     |
| **Lokalna baza danych**         | **LocalStorage + Mock Data** | Zapis danych w przeglądarce oraz zestaw danych testowych (Mock JSON).            |
| **Routing**                     | **React Router DOM v6**      | Nawigacja pomiędzy widokami aplikacji.                                           |

## 5. Architektura danych (Client-Only Flow)

1. **Initial Seed (Tryb demo):** Przy pierwszym uruchomieniu aplikacja ładuje zestaw danych testowych.
2. **Lokalna trwałość:** Transakcje, subskrypcje i dane o wynagrodzeniu są zapisywane w `localStorage` za pośrednictwem Zustand.
3. **Eksport/Import JSON:** Funkcja eksportu danych do pliku `.json` i ich ponownego importu.

## 6. Skład zespołu i podział ról

- **[Imię i Nazwisko 1]** — Team Lead / React Architect (Zarządzanie stanem, synchronizacja z LocalStorage, Router)
- **[Imię i Nazwisko 2]** — UI/UX Lead (Tailwind CSS, Layout, komponenty UI)
- **[Imię i Nazwisko 3]** — Module Lead: Subscription Manager (Logika powiadomień, analiza użytkowania)
- **[Imię i Nazwisko 4]** — Module Lead: Analytics & Charts (Integracja Recharts, raporty, obliczanie okresu budżetowego)

## 7. Plan realizacji

1. **Etap 1: Inicjalizacja i makieta podstawowa**
   - Konfiguracja Vite + React + TypeScript + Tailwind CSS.
   - Stworzenie paska bocznego (sidebar), nawigacji i układu stron.
2. **Etap 2: Moduł przychodów i wydatków**
   - Formularze dodawania transakcji i wprowadzania pensji.
   - Konfiguracja Zustand i zapisu w `localStorage`.
3. **Etap 3: Moduł subskrypcji**
   - Karta subskrypcji, kalendarz płatności i wskaźniki użytkowania.
4. **Etap 4: Wizualizacja i analityka**
   - Podłączenie wykresów Recharts do analizy wydatków i budżetu.
5. **Etap 5: Wdrożenie i testy**
   - Wypełnienie danymi testowymi na potrzeby prezentacji.
   - Wdrożenie aplikacji na GitHub Pages lub Vercel.
