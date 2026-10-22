# Personal Finance & Subscription Tracker (Dorado)

## 1. Opis projektu

Dorado to kompleksowa aplikacja internetowa do zarządzania osobistymi finansami (przychodami stałymi i dodatkowymi/premiami, wydatkami codziennymi oraz opłatami cyklicznymi/subskrypcjami), działająca w pełni po stronie klienta (Client-Side Only).

Aplikacja łączy zaawansowane funkcje budżetowe z inteligentnym systemem powiadomień i powiadomień o stanie konta. Pozwala użytkownikowi elastycznie definiować okresy rozliczeniowe, automatycznie przeliczać nadwyżki, kontrolować limity oraz analizować bieżący stan majątkowy w sposób w pełni bezpieczny i prywatny.

Projekt jest realizowany w ramach przedmiotu "Programowanie Front-end".

---

## 2. Cel i założenia projektu

- **Główny cel:** Stworzenie profesjonalnego, responsywnego narzędzia do pełnej kontroli budżetu osobistego z systemem powiadomień w czasie rzeczywistym i alertów ostrzegawczych.
- **Założenia techniczne i architektoniczne:**
  - Nowoczesny interfejs użytkownika (UI/UX) z obsługą motywów (Dark/Light Mode) oraz centrum powiadomień (Toasty / Alert Center).
  - Architektura oparta wyłącznie na Front-endzie z lokalną trwałością danych (`localStorage`) i pełną prywatnością użytkownika.
  - Rygorystyczna walidacja danych, obsługa przypadków brzegowych (Edge Cases) oraz mechanizmy bezpieczeństwa operacji.

---

## 3. Funkcjonalności

### 3.1. Cykl budżetowy, przychody i premie

- **Elastyczny okres rozliczeniowy (Custom Billing Cycle):**
  - Domyślnie budżet liczony jest od 1. dnia miesiąca (lub wybranego dnia startu cyklu, np. 15. dnia).
  - **Obsługa nadwyżek (Rollover & Carryover):** Automatyczne obliczanie "nadwyżki lub niedoboru" z poprzedniego okresu i doliczanie jej do bilansu otwarcia nowego cyklu.
- **Ewidencja przychodów (Stałe vs. Dodatkowe/Premie):**
  - **Wynagrodzenie stałe (Cykliczne):** Podstawowa pensja przypisana do harmonogramu cyklu.
  - **Premie i dochody nieregularne:** Szybkie dodawanie jednorazowych zastrzyków gotówki z innych źródeł (freelance, premie) z możliwością wyboru daty wpływu.

### 3.2. Wydatki, kastomizacja i historia transakcji

- **Kategorie domyślne i własne (Custom Categories):** Wbudowane kategorie oraz kreator własnych kategorii wydatków i przychodów z ikonami i kolorami.
- **Historia transakcji:** Tabela operacji z zaawansowanym filtrowaniem, wyszukiwaniem i edycją.

### 3.3. Menedżer subskrypcji i opłat stałych

- **Ewidencja płatności cyklicznych:** Rejestracja usług (Netflix, Spotify, czynsz) z automatycznym generowaniem wydatków w bilansie oraz kalendarzem płatności.

### 3.4. System powiadomień i inteligentnych alertów (Notification Center)

- **Powiadomienia o operacjach (Transaction Toasts):** Natychmiastowe komunikaty potwierdzające pomyślne dodanie, edycję lub usunięcie przychodu lub wydatku.
- **Inteligentny alert niskiego salda (Low-Balance Smart Alert):**
  - System stale monitoruje stan środków od początku bieżącego cyklu rozliczeniowego.
  - **Własny próg ostrzegawczy:** Użytkownik może w ustawieniach w każdej chwili zmienić kwotę krytycznego progu. Jeśli w momencie zatwierdzenia zmiany saldo jest już niższe niż nowy próg, aplikacja **natychmiast w tej samej sekundzie** wyśle powiadomienie ostrzegawcze (np. _„Wydałeś już 6 500 zł. Na Twoim koncie pozostało tylko 750 zł”_).
  - **Logika "Trigger Once":** Standardowy alert wysyła się jednorazowo w danym cyklu, aby nie spamować użytkownika. Flaga powiadomienia resetuje się automatycznie wraz z rozpoczęciem nowego okresu lub po zaksięgowaniu nowego przychodu/premii.

### 3.5. Analityka, bilans i prognozowanie

- **Pulpit główny (Dashboard):** Podsumowanie finansowe, wykresy analityczne (Recharts) oraz dynamiczny wskaźnik **Safe-to-Spend**.

---

## 4. Kwestie Techniczne, Walidacja i Logika UX

### 4.1. Walidacja danych (Data Validation)

- Walidacja typów i kwot (Zod), blokada wartości ujemnych, zaokrąglanie do 2 miejsc po przecinku, poprawność dat oraz unikalność kastomowych kategorii.

### 4.2. Bezpieczeństwo Operacji i User Safeguards

- Modale potwierdzenia, mechanizm cofania akcji (_Undo_ dla powiadomień Toast) oraz 100% prywatności danych w `localStorage`.

### 4.3. Przypadki Brzegowe (Edge Cases)

1. **Zmiana dnia cyklu w trakcie miesiąca:** Przeliczanie okresu przejściowego bez utraty spójności powiadomień i historii.
2. **Subskrypcje w dniach nieistniejących (np. 31. lutego):** Automatyczne korygowanie daty płatności na ostatni dzień miesiąca.
3. **Puste stany (Empty States) i zarządzanie stanem powiadomień:** Obsługa flagi jednorazowego wyświetlenia alertu niskiego salda (`lowBalanceAlertTriggered: boolean`) w pamięci lokalnej, co zapobiega ponownemu wysyłaniu tego samego ostrzeżenia po odświeżeniu strony.

---

## 5. Stos technologiczny

| Kategoria                       | Technologia                  | Uzasadnienie wyboru                                                    |
| ------------------------------- | ---------------------------- | ---------------------------------------------------------------------- |
| **Narzędzie budowania & Rdzeń** | **React + Vite**             | Szybkie budowanie, wydajność oraz świetne wsparcie HMR.                |
| **Język programowania**         | **TypeScript**               | Ścisłe typowanie modeli danych finansowych i powiadomień.              |
| **Stylizowanie i Motywy**       | **Tailwind CSS**             | Szybkie tworzenie responsywnego interfejsu (RWD) oraz Light/Dark Mode. |
| **Komponenty UI & Ikony**       | **Shadcn UI + Lucide Icons** | Dostępne komponenty interfejsu, modale i system powiadomień Toast.     |
| **Zarządzanie stanem**          | **Zustand (+ Persist)**      | Lekki magazyn stanu z synchronizacją z `localStorage`.                 |
| **Walidacja formularzy**        | **Zod + React Hook Form**    | Bezpieczna walidacja schematów danych.                                 |
| **Wykresy i Daty**              | **Recharts / date-fns**      | Wykresy analityczne oraz obsługa cykli budżetowych.                    |
| **Testowanie logiki**           | **Vitest**                   | Testy jednostkowe dla logiki budżetowej i warunków powiadomień.        |

---

## 6. Architektura danych i Persystencja

1. **Initial Seed (Tryb demo):** Automatyczne ładowanie danych demonstracyjnych przy pierwszym uruchomieniu.
2. **Persystencja lokalna:** Zapis stanów transakcji, subskrypcji oraz flag powiadomień w `localStorage`.
3. **Kopia zapasowa (Backup):** Eksport i import bazy danych do pliku JSON.

---

## 7. Skład zespołu i podział ról

- **Denys Kononchuk 58843** — Team Lead / React Architect (Zarządzanie stanem Zustand, logika cykli budżetowych, algorytmy powiadomień i flagi niskiego salda, testy Vitest)
- **Illia Isaiev 58835** — UI/UX Lead (Tailwind CSS, obsługa Shadcn UI, system Toast / Notification Center, Light/Dark Mode, RWD)
- **Mykola Safiiuk 56103** — Module Lead: Subscription & Transactions Manager (Formularze walidowane Zod, obsługa kastomowych kategorii i historii transakcji)
- **Roman Melnyk 56175** — Module Lead: Analytics & Charts (Integracja Recharts, dashboard, wskaźnik Safe-to-Spend, eksport JSON)

---

## 8. Plan realizacji

1. **Etap 1: Inicjalizacja, motywy i makieta bazowa** (Vite, TS, Tailwind, Shadcn, Sidebar).
2. **Etap 2: Moduł przychodów (stałe + premie), wydatków i powiadomień Toast** (Formularze Zod, powiadomienia o operacjach).
3. **Etap 3: Logika cyklu budżetowego, subskrypcji i alertu niskiego salda** (Obsługa rollover, jednorazowy alert o niskim stanie konta oraz natychmiastowe powiadomienie przy zmianie progu).
4. **Etap 4: Wizualizacja, analityka i kastomizacja** (Recharts, Safe-to-Spend, własne kategorie).
5. **Etap 5: Testy jednostkowe, edge-cases i wdrożenie** (Testy Vitest dla logiki powiadomień i cykli, deploy na Vercel).
