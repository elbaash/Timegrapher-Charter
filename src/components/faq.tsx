"use client";

import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";

export function Faq() {
  return (
    <div className="max-w-3xl mx-auto">
        <h2 className="text-2xl font-bold text-center mb-4 font-headline">Weishi Timegrapher No. 1000 FAQ</h2>
      <Accordion type="single" collapsible className="w-full">
        <AccordionItem value="item-1">
          <AccordionTrigger>How do I get started with the Timegrapher No. 1000?</AccordionTrigger>
          <AccordionContent>
            <ol className="list-decimal list-inside space-y-2">
              <li><strong>Power On:</strong> Connect the timegrapher to power and turn it on.</li>
              <li><strong>Mount Watch:</strong> Place the watch securely on the 6-position microphone stand. Make sure the crown is not touching the clamp.</li>
              <li><strong>Set Parameters:</strong> The timegrapher will often automatically detect the beat number (lift angle). If not, you may need to set it manually. The most common beat numbers are 28800 and 21600. The default lift angle is usually 52°, which is correct for most modern movements.</li>
              <li><strong>Start Analysis:</strong> The machine will begin displaying readings automatically.</li>
            </ol>
          </AccordionContent>
        </AccordionItem>
        <AccordionItem value="item-2">
          <AccordionTrigger>What do the main buttons do?</AccordionTrigger>
          <AccordionContent>
            <ul className="list-disc list-inside space-y-2">
              <li><strong>Start/Stop:</strong> Begins or pauses the measurement process.</li>
              <li><strong>Beat/Rate Selector:</strong> Allows you to manually select the beat number (e.g., 28800, 21600, 18000). Press and hold to let the machine try to detect it automatically.</li>
              <li><strong>Lift Angle:</strong> Use this to set the lift angle of the specific watch movement you are testing. You can usually find this information in the movement's technical guide.</li>
              <li><strong>Display Mode:</strong> Switches between different views on the screen, such as showing a continuous line graph or a view with more statistical data.</li>
            </ul>
          </AccordionContent>
        </AccordionItem>
        <AccordionItem value="item-3">
          <AccordionTrigger>How long should I wait before taking a reading?</AccordionTrigger>
          <AccordionContent>
            For best results, let the watch run on the timegrapher for at least <strong>30 to 60 seconds</strong>. This allows the readings to stabilize and gives you a more accurate average of the watch's performance. The line on the screen should become relatively straight and consistent. Fluctuations are normal, but you are looking for a stable trend.
          </AccordionContent>
        </AccordionItem>
        <AccordionItem value="item-4">
          <AccordionTrigger>What do the main readings mean?</AccordionTrigger>
          <AccordionContent>
             <ul className="list-disc list-inside space-y-2">
                <li><strong>Rate (s/d):</strong> This is the accuracy of the watch, measured in seconds per day. A positive number means the watch is running fast, while a negative number means it's running slow.</li>
                <li><strong>Amplitude (°):</strong> This measures the amount of rotation in the swing of the balance wheel. A healthy amplitude for a fully wound watch is typically between 270° and 310°.</li>
                <li><strong>Beat Error (ms):</strong> This is the measure of how centered the balance wheel's impulse is. A lower beat error is better, with 0.0ms being perfect. Anything under 0.5ms is generally considered very good.</li>
            </ul>
          </AccordionContent>
        </AccordionItem>
      </Accordion>
    </div>
  );
}
