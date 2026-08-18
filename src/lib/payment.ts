/**
 * Paiement anticipé d'une précommande.
 *
 * Le lien Wave est un lien marchand fixe : il n'emporte ni montant ni référence
 * de commande. C'est pour cela que la capture d'écran du paiement est demandée
 * au client — sans elle, rien ne relie le versement reçu à sa réservation.
 */
export const WAVE_PAYMENT_URL = 'https://pay.wave.com/m/M_s9n-YOSNRCv9/c/ci/'
