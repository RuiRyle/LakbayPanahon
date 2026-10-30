$ErrorActionPreference = 'Stop'

$repoRoot = Split-Path -Parent $PSScriptRoot
$snapshotPath = Join-Path $repoRoot 'docs\validation\learning-content-snapshot.json'
$outputPath = Join-Path $repoRoot 'data\other-missions-adaptive-quiz-question-drafts.json'
$snapshot = Get-Content $snapshotPath -Raw | ConvertFrom-Json
$sources = @{}

foreach ($question in $snapshot.collections.questions | Where-Object { $_.status -eq 'active' }) {
    $key = '{0}|{1}' -f $question.quizId, $question.topic
    if (-not $sources.ContainsKey($key) -or $question.order -lt $sources[$key].order) {
        $sources[$key] = $question
    }
}

$migrationFiles = Get-ChildItem (Join-Path $repoRoot 'data') -Filter '*.json' | Sort-Object LastWriteTime
foreach ($file in $migrationFiles) {
    try {
        $migration = Get-Content $file.FullName -Raw | ConvertFrom-Json
    }
    catch {
        continue
    }

    foreach ($write in @($migration.writes)) {
        if ($write.path -notlike 'questions/*' -or -not $write.fields.quizId -or -not $write.fields.topic) {
            continue
        }

        $question = $write.fields
        $key = '{0}|{1}' -f $question.quizId, $question.topic
        if ($sources.ContainsKey($key)) {
            continue
        }
        if (-not $question.learningPoint -or -not $question.historicalClue) {
            continue
        }
        if (-not $question.optionA -or -not $question.optionB -or -not $question.optionC -or -not $question.optionD) {
            continue
        }
        $sources[$key] = $question
    }
}

function Get-FirstSentence([string] $text, [int] $limit = 180) {
    $value = ($text -replace '\s+', ' ').Trim()
    if ($value -match '^(.+?)[.!?](?:\s|$)') {
        $value = $Matches[1].Trim()
    }
    if ($value.Length -gt $limit) {
        $value = $value.Substring(0, $limit - 1).TrimEnd() + '…'
    }
    return $value
}

$writes = [System.Collections.Generic.List[object]]::new()
$quizGroups = @($sources.Values | Group-Object quizId | Sort-Object Name)
$skippedQuizId = 'quiz-1'
$topicCount = 0
$includedQuizzes = 0
$quizIndex = 0

foreach ($quizGroup in $quizGroups) {
    $quizId = [string]$quizGroup.Name
    $quizIndex++

    # Mission 1 has a separately authored draft file.
    if ($quizId -eq $skippedQuizId) {
        continue
    }

    $topics = @($quizGroup.Group | Sort-Object order, topic)
    if ($topics.Count -ne 5) {
        continue
    }
    $includedQuizzes++

    for ($topicIndex = 0; $topicIndex -lt $topics.Count; $topicIndex++) {
        $source = $topics[$topicIndex]
        $topicId = [string]$source.topic
        $topicLabel = if ($source.topicLabel) { [string]$source.topicLabel } else { $topicId }
        $learningPoint = ([string]$source.learningPoint -replace '\s+', ' ').Trim()
        $topicCount++

        $easyOptions = [ordered]@{
            A = [string]$source.optionA
            B = [string]$source.optionB
            C = [string]$source.optionC
            D = [string]$source.optionD
        }
        $easyFeedback = [ordered]@{}
        foreach ($letter in @('A', 'B', 'C', 'D')) {
            $feedback = $null
            if ($source.answerExplanations) {
                $feedback = $source.answerExplanations.$letter
            }
            if (-not $feedback) {
                $feedback = if ($letter -eq $source.correctAnswer) {
                    [string]$source.explanation
                }
                else {
                    'This choice does not match the lesson point being checked.'
                }
            }
            $easyFeedback[$letter] = [string]$feedback
        }

        $easyFields = [ordered]@{
            quizId = $quizId
            topic = $topicId
            difficulty = 'easy'
            status = 'draft'
            question = "Which choice best matches the lesson's main idea about ${topicLabel}?"
            optionA = $easyOptions.A
            optionB = $easyOptions.B
            optionC = $easyOptions.C
            optionD = $easyOptions.D
            correctAnswer = [string]$source.correctAnswer
            explanation = [string]$source.explanation
            learningPoint = $learningPoint
            answerExplanations = $easyFeedback
        }
        $safeTopic = $topicId -replace '[^a-zA-Z0-9-]', '-'
        $easyId = '{0}-question-{1}-adaptive-easy' -f $quizId, $safeTopic
        $writes.Add([ordered]@{
            path = "questions/$easyId"
            create = $true
            fields = $easyFields
        })

        $siblingTopics = @($topics | Where-Object { $_.topic -ne $topicId })
        $hardAnswers = [System.Collections.Generic.List[object]]::new()
        $hardAnswers.Add([pscustomobject]@{
            text = 'The note supports the point it states in this case; broader conclusions need more evidence.'
            topicLabel = $topicLabel
            correct = $true
            feedback = "Correct. This keeps the conclusion within the note's evidence about $topicLabel."
        })
        foreach ($sibling in $siblingTopics) {
            if ($hardAnswers.Count -ge 2) {
                break
            }
            $siblingPoint = Get-FirstSentence ([string]$sibling.learningPoint)
            if ($siblingPoint -and -not @($hardAnswers | Where-Object { $_.text -eq $siblingPoint }).Count) {
                $hardAnswers.Add([pscustomobject]@{
                    text = $siblingPoint
                    topicLabel = [string]$sibling.topicLabel
                    correct = $false
                    feedback = "This is a point about $($sibling.topicLabel); the note does not establish it here."
                })
            }
        }
        while ($hardAnswers.Count -lt 2) {
            $hardAnswers.Add([pscustomobject]@{
                text = 'The note proves that every place and time had the same conditions.'
                topicLabel = ''
                correct = $false
                feedback = 'The note describes a limited case; it does not establish a rule for every place and time.'
            })
        }
        $hardAnswers.Add([pscustomobject]@{
            text = 'The note answers every question about this topic by itself.'
            topicLabel = ''
            correct = $false
            feedback = 'One note can support a focused conclusion, but it cannot answer every question about a topic.'
        })
        $hardAnswers.Add([pscustomobject]@{
            text = 'The note proves the opposite was true in every other place and time.'
            topicLabel = ''
            correct = $false
            feedback = 'The note does not prove what happened in every other place or time.'
        })

        $rotation = ($quizIndex + $topicIndex) % 4
        $orderedHardAnswers = for ($choiceIndex = 0; $choiceIndex -lt 4; $choiceIndex++) {
            $hardAnswers[($choiceIndex + $rotation) % 4]
        }
        $letters = @('A', 'B', 'C', 'D')
        $hardOptions = [ordered]@{}
        $hardFeedback = [ordered]@{}
        $correctKey = ''
        for ($choiceIndex = 0; $choiceIndex -lt 4; $choiceIndex++) {
            $letter = $letters[$choiceIndex]
            $answer = $orderedHardAnswers[$choiceIndex]
            $hardOptions[$letter] = [string]$answer.text
            if ($answer.correct) {
                $correctKey = $letter
            }
            $hardFeedback[$letter] = [string]$answer.feedback
        }

        $clue = Get-FirstSentence ([string]$source.historicalClue) 240
        if ($clue -notmatch '[.!?]$') { $clue += '.' }
        $hardFields = [ordered]@{
            quizId = $quizId
            topic = $topicId
            difficulty = 'hard'
            status = 'draft'
            question = "A lesson note says: `"$clue`" Which conclusion about $topicLabel is best supported?"
            optionA = $hardOptions.A
            optionB = $hardOptions.B
            optionC = $hardOptions.C
            optionD = $hardOptions.D
            correctAnswer = $correctKey
            explanation = "The note supports a focused conclusion about $topicLabel; it should not be stretched into a claim about every community."
            learningPoint = $learningPoint
            answerExplanations = $hardFeedback
        }
        $hardId = '{0}-question-{1}-adaptive-hard' -f $quizId, $safeTopic
        $writes.Add([ordered]@{
            path = "questions/$hardId"
            create = $true
            fields = $hardFields
        })
    }
}

$payload = [ordered]@{
    projectId = 'lakbaypanahon-1797e'
    generatedAt = '2026-10-30'
    reviewStatus = 'Source manifest remains draft; active Firestore copies were published on 2026-10-30; educator review is recommended'
    sourceSnapshot = 'docs/validation/learning-content-snapshot.json (2026-10-27)'
    additionalSources = 'Question documents in local data migration JSON files for quizzes beyond the snapshot'
    excludedQuiz = 'quiz-1; its 10 hand-authored variants are in mission1-adaptive-quiz-question-drafts.json'
    includedQuizCount = $includedQuizzes
    includedTopicCount = $topicCount
    draftQuestionCount = $writes.Count
    writes = @($writes)
}

$json = ConvertTo-Json -InputObject $payload -Depth 14
Set-Content -LiteralPath $outputPath -Value $json -Encoding utf8
Write-Output ("Wrote {0} draft questions across {1} quizzes and {2} topics to {3}" -f $writes.Count, $includedQuizzes, $topicCount, $outputPath)
