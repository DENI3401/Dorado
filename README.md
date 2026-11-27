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

## 7. Skład zespołu i podział odpowiedzialności

> Stan na 17.11.2026. Podział zaktualizowano na podstawie historii commitów: w praktyce moduły transakcji, kategorii i subskrypcji zostały podzielone **warstwowo** (Mykola: logika, typy, store, schematy Zod, testy; Illia: komponenty UI, strony, kalendarz), a nie według pierwotnego przydziału funkcji.

| Osoba | GitHub | Rola | Zrealizowane | Do zrobienia |
| --- | --- | --- | --- | --- |
| Denys Kononchuk (58843) | [@DENI3401](https://github.com/DENI3401) | Team Lead / React Architect | F0 Inicjalizacja i makieta bazowa, bazowy Toaster i dialogi Shadcn (F7), tunel do testów na telefonach (F17), przegląd i scalanie PR | F2 Cykl budżetowy, rollover i store ustawień, F3 Alert niskiego salda, F16 Testy Vitest |
| Illia Isaiev (58835) | [@SKAYT950](https://github.com/SKAYT950) | UI/UX Lead | UI dla F4, F8, F10, F11; F5 Kalendarz płatności; F7 Toast, Undo i modale; synchronizacja płatności subskrypcji z transakcjami (F4); F17 Responsywność | F6 Ustawienia |
| Mykola Safiiuk (56103) | [@sksooper](https://github.com/sksooper) | Module Lead: Logika danych (Transactions, Categories, Subscriptions) | F1 Warstwa danych i store; logika i schematy Zod dla F4, F8, F10, F11; konfiguracja Vitest; F9 Wynagrodzenie stałe | F14 Eksport i import JSON |
| Roman Melnyk (56175) | [@Roman767409](https://github.com/Roman767409) | Module Lead: Analytics & Charts | — | F12 Dashboard i wykresy, F13 Safe-to-Spend, F15 Seed demo |

### Mapa funkcji

| ID | Funkcja | Właściciel | Etap (Milestone) | Status |
| --- | --- | --- | --- | --- |
| F0 | Inicjalizacja projektu, motywy i makieta bazowa | Denys | Etap 1 | ✅ Zamknięte |
| F1 | Warstwa danych: typy i store Zustand + persist | Mykola | Etap 2 | ✅ Zamknięte |
| F2 | Cykl budżetowy, rollover i store ustawień | Denys | Etap 3 | ⏳ Otwarte |
| F3 | Alert niskiego salda (Trigger Once) | Denys | Etap 3 | ⏳ Otwarte |
| F4 | Menedżer subskrypcji i automatyczne płatności | Mykola (logika), Illia (UI) | Etap 3 | ✅ Zamknięte |
| F5 | Kalendarz płatności | Illia | Etap 3 | ✅ Zamknięte |
| F6 | Ustawienia (próg alertu, dzień cyklu) | Illia | Etap 3 | ✅ Zamknięte |
| F7 | Toast, Undo i modale potwierdzenia | Illia, Denys | Etap 2 | ✅ Zamknięte |
| F8 | Formularz transakcji: wydatki i przychody jednorazowe | Mykola (Zod), Illia (UI) | Etap 2 | ✅ Zamknięte |
| F9 | Wynagrodzenie stałe (przychód cykliczny) | Mykola | Etap 3 | ✅ Zamknięte |
| F10 | Kategorie własne | Mykola (logika), Illia (UI) | Etap 2 | ✅ Zamknięte |
| F11 | Historia transakcji (filtry, edycja) | Mykola (logika), Illia (UI) | Etap 2 | ✅ Zamknięte |
| F12 | Dashboard i wykresy Recharts | Roman | Etap 4 | ⏳ Otwarte |
| F13 | Wskaźnik Safe-to-Spend | Roman | Etap 4 | ⏳ Otwarte |
| F14 | Eksport i import JSON | Mykola | Etap 4 | ⏳ Otwarte |
| F15 | Seed demo (dane testowe) | Roman | Etap 5 | ⏳ Otwarte |
| F16 | Testy Vitest i edge cases | Denys | Etap 5 | ⏳ Otwarte |
| F17 | Responsywność i testy na urządzeniach mobilnych | Illia, Denys | Etap 3 | ✅ Zamknięte |

### Zasady pracy

- Każda funkcja ma osobne Issue (Assignee, Milestone, etykieta `funkcja`) z opisem: Co robi użytkownik / Widok / Dane / Najtrudniejsze / Gotowe, gdy.
- Jeśli nad funkcją pracują dwie osoby (np. logika i UI), obie są przypisane jako Assignees, a podział jest opisany w Issue.
- Issue zamyka się automatycznie przez `Closes #<numer>` w opisie Pull Requesta.
- Praca w gałęzi `feature/<nazwa>`, scalanie przez Pull Request do `test`, a `test` → `main` po ukończeniu etapu.
- Team Lead przegląda Pull Requesty.

---

## 8. Plan realizacji

1. **Etap 1: Inicjalizacja, motywy i makieta bazowa** (Vite, TS, Tailwind, Shadcn, Sidebar).
2. **Etap 2: Moduł przychodów (stałe + premie), wydatków i powiadomień Toast** (Formularze Zod, powiadomienia o operacjach).
3. **Etap 3: Logika cyklu budżetowego, subskrypcji i alertu niskiego salda** (Obsługa rollover, jednorazowy alert o niskim stanie konta oraz natychmiastowe powiadomienie przy zmianie progu).
4. **Etap 4: Wizualizacja, analityka i kastomizacja** (Recharts, Safe-to-Spend, własne kategorie).
5. **Etap 5: Testy jednostkowe, edge-cases i wdrożenie** (Testy Vitest dla logiki powiadomień i cykli, deploy na Vercel).
