'use client';

import { motion } from 'framer-motion';
import { Heart, Gem, Sparkles, Users } from 'lucide-react';
import Link from 'next/link';
import Button from '@/components/ui/Button';

const values = [
  {
    icon: Heart,
    title: 'Passione Familiare',
    description: 'Tre generazioni di amore per l\'oreficeria e l\'orologeria, dal nonno Pietro ai fratelli Juric, Paolo e Simone.',
  },
  {
    icon: Gem,
    title: 'Artigianalità',
    description: 'Ogni gioiello è realizzato interamente a mano, utilizzando materiali selezionati e tecniche artigianali tradizionali.',
  },
  {
    icon: Sparkles,
    title: 'Qualità Garantita',
    description: 'Dal produttore al consumatore: un valore aggiunto che in pochi sono in grado di offrire.',
  },
  {
    icon: Users,
    title: 'Ascolto del Cliente',
    description: 'Il nostro design nasce dalle esigenze e dai desideri dei clienti, trasformando sogni in opere d\'arte.',
  },
];

const timeline = [
  {
    year: '1960',
    title: 'Le Origini',
    description: 'L\'azienda Mazzon nasce dalla passione per gli orologi di nonno Pietro, poi portata avanti dal figlio Gaudenzio.',
  },
  {
    year: '1970',
    title: 'L\'Apprendistato',
    description: 'Gaudenzio, perso il padre a soli 13 anni, inizia come "ragazzo di bottega" in un noto negozio di Padova, apprendendo le tecniche artigianali della lavorazione dell\'oro e della riparazione di orologi.',
  },
  {
    year: '1990',
    title: 'L\'Attività Propria',
    description: 'Gaudenzio apre la propria attività, diventando un punto di riferimento dell\'orologeria e oreficeria dell\'Alta Padovana.',
  },
  {
    year: '2004',
    title: 'Mazzon Gioielli S.N.C.',
    description: 'I tre fratelli Juric, Paolo e Simone diventano soci alla pari, unendo l\'artigianalità e i valori tramandati da generazioni alla tecnologia dei tempi moderni.',
  },
  {
    year: '2020',
    title: 'Nasce il Marchio GAUROSA',
    description: 'Il marchio viene brevettato unendo i nomi dei genitori: GAUdenzio e ROSAnna, un riconoscimento con significato di unione familiare.',
  },
];

export default function ChiSiamoPage() {
  return (
    <div className="min-h-screen">
      {/* Hero */}
      <section className="relative bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 text-white py-24 lg:py-32">
        <div className="container mx-auto px-4 text-center">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
          >
            <h1 className="text-4xl lg:text-6xl font-bold tracking-tight">
              Chi Siamo
            </h1>
            <p className="mt-6 text-lg lg:text-xl text-gray-300 max-w-3xl mx-auto leading-relaxed">
              Gaurosa nasce dall&apos;idea di unire i nomi dei nostri genitori: <strong className="text-amber-300">Gau</strong>denzio e <strong className="text-amber-300">Rosa</strong>nna, 
              un riconoscimento che ci piaceva dar loro con significato di unione familiare.
            </p>
          </motion.div>
        </div>
      </section>

      {/* La Storia */}
      <section className="py-16 lg:py-24 bg-white">
        <div className="container mx-auto px-4">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="max-w-3xl mx-auto"
          >
            <h2 className="text-3xl lg:text-4xl font-bold text-gray-900 mb-8">
              La Nostra Storia
            </h2>
            <div className="prose prose-lg text-gray-600 space-y-6">
              <p>
                L&apos;azienda Mazzon nasce oltre 65 anni fa dalla passione per gli orologi di nonno Pietro, 
                poi portata avanti dal figlio Gaudenzio. Perso il padre quando aveva solamente 13 anni, 
                Gaudenzio inizia a lavorare come &quot;ragazzo di bottega&quot; in un noto negozio di Padova, 
                dove apprende le tecniche artigianali e rudimentali della lavorazione dell&apos;oro e della 
                riparazione di orologi, poi affinate nel tempo con molta esperienza e passione.
              </p>
              <p>
                Gaudenzio, dopo molti anni, decide di aprire una propria attività diventando uno dei 
                punti di riferimento dell&apos;orologeria e oreficeria dell&apos;Alta Padovana. Successivamente, 
                affiancato dai figli Juric, Paolo e Simone, ingrandisce la propria attività fornendo ai 
                clienti un servizio di lavorazione artigianale e assistenza.
              </p>
              <p>
                Dopo il pensionamento del padre, coerenti a questa filosofia, i tre fratelli nel 2004 
                diventano soci alla pari cambiando sede e nome all&apos;azienda. Nasce così <strong>&quot;Mazzon Gioielli S.N.C.&quot;</strong> che 
                continua nei lavori di arte orafa e orologiaia, avvalendosi degli studi dei tre fratelli 
                per unire l&apos;artigianalità e i valori tramandati da generazioni alla tecnologia dei tempi moderni.
              </p>
              <p>
                Realizziamo tutti i vostri sogni direttamente nei nostri laboratori, passando così dal 
                produttore al consumatore: un valore aggiunto che, in questi tempi, in pochi sono in grado di offrire. 
                Tre fratelli che lavorano assieme con passione e professionalità, questa è Mazzon Gioielli S.N.C.
              </p>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Timeline */}
      <section className="py-16 lg:py-24 bg-gray-50">
        <div className="container mx-auto px-4">
          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-3xl lg:text-4xl font-bold text-gray-900 text-center mb-16"
          >
            Il Nostro Percorso
          </motion.h2>

          <div className="max-w-3xl mx-auto">
            {timeline.map((item, index) => (
              <motion.div
                key={item.year}
                initial={{ opacity: 0, x: index % 2 === 0 ? -30 : 30 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1 }}
                className="flex gap-6 mb-12 last:mb-0"
              >
                <div className="flex-shrink-0 w-20 text-right">
                  <span className="text-2xl font-bold text-gray-900">{item.year}</span>
                </div>
                <div className="relative flex-shrink-0">
                  <div className="w-4 h-4 bg-gray-900 rounded-full mt-2" />
                  {index < timeline.length - 1 && (
                    <div className="absolute top-6 left-1.5 w-0.5 h-full bg-gray-200" />
                  )}
                </div>
                <div className="pb-8">
                  <h3 className="text-xl font-semibold text-gray-900">{item.title}</h3>
                  <p className="mt-2 text-gray-600 leading-relaxed">{item.description}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Il Marchio */}
      <section className="py-16 lg:py-24 bg-white">
        <div className="container mx-auto px-4">
          <div className="max-w-3xl mx-auto">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
            >
              <h2 className="text-3xl lg:text-4xl font-bold text-gray-900 mb-8">
                Il Marchio GAUROSA
              </h2>
              <div className="prose prose-lg text-gray-600 space-y-6">
                <p>
                  Nel 2020, la domanda dei prodotti di gioielleria di nostra produzione, fatti e rifiniti a mano, 
                  aumentava e meritava un&apos;identità. Abbiamo dunque deciso di brevettare il marchio <strong>GAUROSA</strong>.
                </p>
                <p>
                  Gaurosa nasce dall&apos;idea di unire i nomi dei nostri genitori: <em>Gaudenzio</em> e <em>Rosanna</em>, 
                  un riconoscimento che ci piaceva dar loro con significato di unione familiare.
                </p>
                <p>
                  Siamo i loro figli, e attraverso ogni creazione celebriamo l&apos;eredità di dedizione, 
                  autenticità e amore per il lavoro che ci hanno lasciato. Ogni gioiello Gaurosa è unico 
                  e realizzato interamente a mano, utilizzando materiali selezionati e tecniche artigianali tradizionali.
                </p>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Design */}
      <section className="py-16 lg:py-24 bg-gray-50">
        <div className="container mx-auto px-4">
          <div className="max-w-3xl mx-auto">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
            >
              <h2 className="text-3xl lg:text-4xl font-bold text-gray-900 mb-8">
                Il Nostro Design
              </h2>
              <p className="text-lg text-gray-600 leading-relaxed">
                Il nostro design prende ispirazione direttamente dalle esigenze e dalle richieste dei clienti. 
                Il nostro personale ascolta i loro desideri di gioiello, studia e cura ogni minimo dettaglio 
                trasformando un sogno in un&apos;opera d&apos;arte. Ogni pezzo è un&apos;opera irripetibile, frutto di esperienza, 
                passione e rispetto per una storia familiare che continua a brillare in ogni creazione.
              </p>
            </motion.div>
          </div>
        </div>
      </section>

      {/* I Nostri Valori */}
      <section className="py-16 lg:py-24 bg-white">
        <div className="container mx-auto px-4">
          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-3xl lg:text-4xl font-bold text-gray-900 text-center mb-12"
          >
            I Nostri Valori
          </motion.h2>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {values.map((value, index) => (
              <motion.div
                key={value.title}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1 }}
                className="text-center p-6"
              >
                <div className="inline-flex items-center justify-center w-14 h-14 bg-gray-900 text-white rounded-full mb-4">
                  <value.icon className="w-6 h-6" />
                </div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">{value.title}</h3>
                <p className="text-gray-600 text-sm leading-relaxed">{value.description}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-16 lg:py-24 bg-gray-900 text-white">
        <div className="container mx-auto px-4 text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
          >
            <h2 className="text-3xl lg:text-4xl font-bold">
              Scopri le Nostre Creazioni
            </h2>
            <p className="mt-4 text-gray-400 max-w-xl mx-auto">
              Ogni gioiello racconta una storia. Trova il tuo nella nostra collezione.
            </p>
            <div className="mt-8">
              <Link href="/prodotti">
                <Button size="lg" className="bg-white text-gray-900 hover:bg-gray-100">
                  Esplora la Collezione
                </Button>
              </Link>
            </div>
          </motion.div>
        </div>
      </section>
    </div>
  );
}
