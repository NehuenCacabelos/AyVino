namespace AyVino.Api.Features.WineCare.Enums;

// De escala (tiene orden): salto de 10.
public enum DrinkingStatus
{
    TooYoung = 10,
    InWindow = 20,
    DrinkSoon = 30,
    PastPeak = 40
}

// Categórico (sin orden): numeración simple.
// Declared: la temperatura la cargó una persona en la cosecha. Inferred: la calculó el motor.
public enum AdviceSource
{
    Declared = 1,
    Inferred = 2
}